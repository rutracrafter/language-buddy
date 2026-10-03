import { GoogleGenAI, Type } from '@google/genai';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import {
  CEFRLevel,
  LearningItem,
  ReviewEvent,
  TopicCoverage,
  BuildOnNote,
  Session,
  FsrsCard,
} from '../types.js';
import { createInitialFsrsCard, scheduleReview } from './fsrs.js';

export interface AnalystResult {
  itemsReviewed: Array<{
    text: string;
    type: 'vocab' | 'phrase' | 'grammar';
    gloss: string;
    cefrLevel: CEFRLevel;
    skill: 'recognition' | 'production';
    outcome: 'again' | 'hard' | 'good' | 'easy';
    evidence: string;
  }>;
  itemsIntroduced: Array<{
    text: string;
    type: 'vocab' | 'phrase' | 'grammar';
    gloss: string;
    cefrLevel: CEFRLevel;
    firstSeenExample: string;
  }>;
  topicCoverage: {
    name: string;
    cefrLevel: CEFRLevel;
    depth: 0 | 1 | 2 | 3;
    notes: string;
  };
  buildOnNotes: Array<{
    kind: 'error_pattern' | 'next_step' | 'interest';
    text: string;
    priority: number;
  }>;
  summary: {
    whatWentWell: string;
    nextFocus: string;
    overallFeedback: string;
  };
}

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

export async function runAnalyst(sessionId: ObjectId): Promise<AnalystResult | null> {
  const collections = getCollections();
  const session = await collections.sessions.findOne({ _id: sessionId });

  if (!session) {
    console.error(`Session ${sessionId} not found for analysis`);
    return null;
  }

  if (!session.transcript || session.transcript.length === 0) {
    console.log(`Session ${sessionId} has empty transcript; skipping analyst.`);
    await collections.sessions.updateOne(
      { _id: sessionId },
      { $set: { analysisStatus: 'done' } }
    );
    return null;
  }

  const ai = getGenAI();

  const transcriptText = session.transcript
    .map((t) => `${t.speaker === 'learner' ? 'Learner' : 'Tutor'}: ${t.text}`)
    .join('\n');

  const toolEventsText = session.toolEvents?.length
    ? JSON.stringify(session.toolEvents, null, 2)
    : 'None logged';

  const prompt = `You are the Session Analyst for an audio-first language learning application.
Analyze this completed practice conversation and extract structured learning updates.

SESSION INFO:
- Native Language: ${session.languages.native}
- Target Language: ${session.languages.target}
- Planned Topic: ${session.plan?.topic || 'General conversation'}
- Target CEFR Level: ${session.plan?.cefrLevel || 'A1'}

LIVE AGENT TOOL EVENTS LOGGED:
${toolEventsText}

CONVERSATION TRANSCRIPT:
${transcriptText}

GRADING RULES FOR ITEMS REVIEWED:
- "production": The learner attempted to say/use the item.
  - "easy": Used correctly, unprompted, fluently.
  - "good": Used correctly, unprompted.
  - "hard": Used after hint or rephrase.
  - "again": Tried and got it wrong, or couldn't produce it.
- "recognition": The learner heard the agent use the item.
  - "good": Responded appropriately, understood meaning.
  - "again": Asked what it meant, or clearly misunderstood.

Analyze the session and return structured JSON matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemsReviewed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['vocab', 'phrase', 'grammar'] },
                  gloss: { type: Type.STRING },
                  cefrLevel: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                  skill: { type: Type.STRING, enum: ['recognition', 'production'] },
                  outcome: { type: Type.STRING, enum: ['again', 'hard', 'good', 'easy'] },
                  evidence: { type: Type.STRING },
                },
                required: ['text', 'type', 'gloss', 'cefrLevel', 'skill', 'outcome', 'evidence'],
              },
            },
            itemsIntroduced: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['vocab', 'phrase', 'grammar'] },
                  gloss: { type: Type.STRING },
                  cefrLevel: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                  firstSeenExample: { type: Type.STRING },
                },
                required: ['text', 'type', 'gloss', 'cefrLevel', 'firstSeenExample'],
              },
            },
            topicCoverage: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                cefrLevel: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                depth: { type: Type.INTEGER, description: '0 to 3' },
                notes: { type: Type.STRING },
              },
              required: ['name', 'cefrLevel', 'depth', 'notes'],
            },
            buildOnNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kind: { type: Type.STRING, enum: ['error_pattern', 'next_step', 'interest'] },
                  text: { type: Type.STRING },
                  priority: { type: Type.INTEGER },
                },
                required: ['kind', 'text', 'priority'],
              },
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                whatWentWell: { type: Type.STRING },
                nextFocus: { type: Type.STRING },
                overallFeedback: { type: Type.STRING },
              },
              required: ['whatWentWell', 'nextFocus', 'overallFeedback'],
            },
          },
          required: [
            'itemsReviewed',
            'itemsIntroduced',
            'topicCoverage',
            'buildOnNotes',
            'summary',
          ],
        },
      },
    });

    const result: AnalystResult = JSON.parse(response.text || '{}');
    const now = new Date();
    const reviewedItemIds: ObjectId[] = [];
    const introducedItemIds: ObjectId[] = [];

    // 1. Process items reviewed (enforce at most 1 graded review per item, per skill, per session)
    for (const reviewed of result.itemsReviewed || []) {
      const cleanText = reviewed.text.trim().toLowerCase();
      let item = await collections.items.findOne({
        userId: session.userId,
        text: { $regex: new RegExp(`^${cleanText}$`, 'i') },
      });

      if (!item) {
        // Create initial item with recognition FSRS card
        const initialRecognitionCard = scheduleReview(createInitialFsrsCard(), reviewed.outcome, now);
        const insertRes = await collections.items.insertOne({
          userId: session.userId,
          type: reviewed.type,
          text: reviewed.text,
          gloss: reviewed.gloss,
          cefrLevel: reviewed.cefrLevel,
          topicTags: [result.topicCoverage?.name || 'conversation'],
          stage: reviewed.skill === 'production' ? 'production' : 'recognition',
          recognition: initialRecognitionCard,
          production:
            reviewed.skill === 'production'
              ? scheduleReview(createInitialFsrsCard(), reviewed.outcome, now)
              : null,
          createdAt: now,
        });
        reviewedItemIds.push(insertRes.insertedId);

        await collections.reviews.insertOne({
          userId: session.userId,
          itemId: insertRes.insertedId,
          sessionId: session._id!,
          skill: reviewed.skill,
          outcome: reviewed.outcome,
          evidence: reviewed.evidence,
          source: 'analyst',
          at: now,
        });
      } else {
        reviewedItemIds.push(item._id!);

        // Enforce rule: max 1 review per item per skill per session
        const existingSessionReview = await collections.reviews.findOne({
          userId: session.userId,
          itemId: item._id!,
          sessionId: session._id!,
          skill: reviewed.skill,
        });

        if (!existingSessionReview) {
          await collections.reviews.insertOne({
            userId: session.userId,
            itemId: item._id!,
            sessionId: session._id!,
            skill: reviewed.skill,
            outcome: reviewed.outcome,
            evidence: reviewed.evidence,
            source: 'analyst',
            at: now,
          });

          // Update FSRS card
          if (reviewed.skill === 'production') {
            const updatedCard = scheduleReview(item.production, reviewed.outcome, now);
            await collections.items.updateOne(
              { _id: item._id },
              { $set: { production: updatedCard } }
            );
          } else {
            const updatedCard = scheduleReview(item.recognition, reviewed.outcome, now);
            await collections.items.updateOne(
              { _id: item._id },
              { $set: { recognition: updatedCard } }
            );
          }

          // Graduation rule: 2 Good-or-better recognition reviews in separate sessions graduate to production
          if (item.stage === 'recognition') {
            const distinctSessionsWithGoodRecognition = await collections.reviews.distinct('sessionId', {
              userId: session.userId,
              itemId: item._id!,
              skill: 'recognition',
              outcome: { $in: ['good', 'easy'] },
            });

            if (distinctSessionsWithGoodRecognition.length >= 2) {
              await collections.items.updateOne(
                { _id: item._id },
                {
                  $set: {
                    stage: 'production',
                    production: createInitialFsrsCard(),
                  },
                }
              );
            }
          }
        }
      }
    }

    // 2. Process items introduced
    for (const intro of result.itemsIntroduced || []) {
      const cleanText = intro.text.trim().toLowerCase();
      const existing = await collections.items.findOne({
        userId: session.userId,
        text: { $regex: new RegExp(`^${cleanText}$`, 'i') },
      });

      if (!existing) {
        const insertRes = await collections.items.insertOne({
          userId: session.userId,
          type: intro.type,
          text: intro.text,
          gloss: intro.gloss,
          cefrLevel: intro.cefrLevel,
          topicTags: [result.topicCoverage?.name || 'conversation'],
          firstSeenExample: intro.firstSeenExample,
          stage: 'recognition',
          recognition: createInitialFsrsCard(),
          production: null,
          createdAt: now,
        });
        introducedItemIds.push(insertRes.insertedId);
      } else {
        introducedItemIds.push(existing._id!);
      }
    }

    // 3. Process topic coverage
    if (result.topicCoverage && result.topicCoverage.name) {
      await collections.topics.updateOne(
        { userId: session.userId, name: result.topicCoverage.name },
        {
          $set: {
            cefrLevel: result.topicCoverage.cefrLevel,
            depth: Math.min(3, Math.max(0, result.topicCoverage.depth)) as 0 | 1 | 2 | 3,
            notes: result.topicCoverage.notes,
            lastCoveredAt: now,
          },
          $inc: { sessionsCount: 1 },
          $setOnInsert: { userId: session.userId, name: result.topicCoverage.name },
        },
        { upsert: true }
      );
    }

    // 4. Process build-on notes
    for (const note of result.buildOnNotes || []) {
      await collections.notes.insertOne({
        userId: session.userId,
        kind: note.kind,
        text: note.text,
        priority: note.priority,
        status: 'open',
        sourceSessionId: session._id,
        createdAt: now,
      });
    }

    // 5. Update session document
    await collections.sessions.updateOne(
      { _id: session._id },
      {
        $set: {
          summary: result.summary,
          itemsReviewed: reviewedItemIds,
          itemsIntroduced: introducedItemIds,
          analysisStatus: 'done',
        },
      }
    );

    console.log(`Analyst successfully processed session ${sessionId}`);
    return result;
  } catch (error) {
    console.error('Analyst execution error:', error);
    await collections.sessions.updateOne(
      { _id: sessionId },
      { $set: { analysisStatus: 'failed' } }
    );
    return null;
  }
}
