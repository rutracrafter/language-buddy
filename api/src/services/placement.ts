import { GoogleGenAI, Type } from '@google/genai';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { CEFRLevel, LearnerProfile, Session, LearningItem } from '../types.js';
import { createInitialFsrsCard } from './fsrs.js';
import { getLanguagePacingGuidelines } from './languageGuidelines.js';

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

export function buildPlacementSystemInstruction(
  nativeLanguage: string,
  targetLanguage: string,
  initialEstimate: string = 'A1',
  speechRate: number = 1.0
): string {
  const pacingGuidelines = getLanguagePacingGuidelines(nativeLanguage, targetLanguage, speechRate);

  return `You are an expert ACTFL-certified oral proficiency interviewer and compassionate language tutor for Language Buddy.
You are conducting a spoken placement interview to determine the learner's CEFR level (A1 to C1) in ${targetLanguage}.

LANGUAGES:
- Learner's native/support language: ${nativeLanguage}
- Target language: ${targetLanguage}
- Use ONLY these two languages.

${pacingGuidelines}

INTERVIEW PHASES (Model: ACTFL Oral Proficiency Interview):
1. Warm-Up (A1):
   - Greet warmly in ${targetLanguage} and ask for their name and how they are today.
   - If they show no comprehension at all, drop to pre-A1/A1 with ${nativeLanguage} comfort and end gently.
2. Level Checks (A1 -> A2 -> B1):
   - Floor check: Tasks that rise in difficulty to find the highest level the learner sustains comfortably.
   - A1: Basic personal details (where are you from, family, daily routine).
   - A2: Describing past events (what did you do yesterday, your last vacation).
3. Probes (B1 -> B2 -> C1):
   - Ceiling check: Push one level higher to see where speech breaks down.
   - B1: Storytelling and personal opinions (why do you like your city, what would you change).
   - B2: Hypotheticals and arguing a position (if you won a lottery, pros and cons of remote work).
   - C1: Abstract social/cultural ideas and nuance.
   - Note: Two consistent breakdowns (inability to form sentences, vocabulary collapse, reverting to native language) at a level identify the ceiling.
4. Wind-Down:
   - Once ceiling is reached or 5 minutes elapse, ask an easy question at their comfort level so they finish on a positive note of success.

TOOLS TO CALL DURING CONVERSATION:
- Call log_level_signal(level, status, evidence):
  - level: "A1", "A2", "B1", "B2", or "C1"
  - status: "sustained" (handled comfortably) or "breakdown" (struggled, sentence structure collapsed, or could not express thought)
  - evidence: quote of what the learner said.
- Call log_error(text, note) for noticeable language mistakes.

COMMUNICATION STYLE:
- Keep turns concise (1 to 2 questions at a time).
- Do not lecture. Give the learner the floor to speak!`;
}

export interface PlacementAnalysisResult {
  level: {
    overall: CEFRLevel;
    speaking: CEFRLevel;
    listening: CEFRLevel;
  };
  levelConfidence: number;
  floorLevel: string;
  ceilingLevel: string;
  starterItems: Array<{
    text: string;
    type: 'vocab' | 'phrase' | 'grammar';
    gloss: string;
    cefrLevel: CEFRLevel;
  }>;
  summary: {
    strengths: string;
    nextSteps: string;
    detailedFeedback: string;
  };
}

export async function runPlacementAnalyst(
  sessionId: ObjectId
): Promise<PlacementAnalysisResult | null> {
  const collections = getCollections();
  const session = await collections.sessions.findOne({ _id: sessionId });

  if (!session || !session.transcript || session.transcript.length === 0) {
    return null;
  }

  const ai = getGenAI();

  const transcriptText = session.transcript
    .map((t) => `${t.speaker === 'learner' ? 'Learner' : 'Interviewer'}: ${t.text}`)
    .join('\n');

  const toolEventsText = session.toolEvents?.length
    ? JSON.stringify(session.toolEvents, null, 2)
    : 'None logged';

  const prompt = `You are the Senior Placement Evaluator for an audio-first language learning application.
Analyze this ACTFL OPI-style placement conversation and determine the learner's true CEFR level (A1 to C1).

TARGET LANGUAGE: ${session.languages.target}
SUPPORT LANGUAGE: ${session.languages.native}

LIVE INTERVIEW TOOL EVENTS LOGGED:
${toolEventsText}

INTERVIEW TRANSCRIPT:
${transcriptText}

EVALUATION CRITERIA:
- A1: Can answer simple questions about self, location, and immediate surroundings with basic words/short phrases.
- A2: Can handle simple routine tasks and past tense narrations of everyday activities.
- B1: Can connect sentences to explain personal experiences, opinions, and tell simple stories.
- B2: Can discuss pros and cons, talk about hypotheticals, and express opinions on general topics fluently.
- C1: Can express complex, abstract ideas fluently with nuance and rich vocabulary.

Determine:
1. Floor level (sustained comfortably)
2. Ceiling level (where speech breaks down)
3. Final CEFR level: overall, speaking, listening
4. Confidence score (0.5 to 0.8)
5. 3 to 5 starter vocabulary or grammar items to recommend for upcoming practice sessions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                speaking: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                listening: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
              },
              required: ['overall', 'speaking', 'listening'],
            },
            levelConfidence: { type: Type.NUMBER },
            floorLevel: { type: Type.STRING },
            ceilingLevel: { type: Type.STRING },
            starterItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['vocab', 'phrase', 'grammar'] },
                  gloss: { type: Type.STRING },
                  cefrLevel: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                },
                required: ['text', 'type', 'gloss', 'cefrLevel'],
              },
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.STRING },
                nextSteps: { type: Type.STRING },
                detailedFeedback: { type: Type.STRING },
              },
              required: ['strengths', 'nextSteps', 'detailedFeedback'],
            },
          },
          required: [
            'level',
            'levelConfidence',
            'floorLevel',
            'ceilingLevel',
            'starterItems',
            'summary',
          ],
        },
      },
    });

    const result: PlacementAnalysisResult = JSON.parse(response.text || '{}');
    const now = new Date();

    // 1. Update learner profile with determined level and confidence
    await collections.profiles.updateOne(
      { userId: session.userId },
      {
        $set: {
          level: result.level,
          levelConfidence: Math.min(0.85, Math.max(0.5, result.levelConfidence || 0.65)),
          placementCompletedAt: now,
          updatedAt: now,
        },
      }
    );

    // 2. Insert recommended starter items into items collection
    const starterItemIds: ObjectId[] = [];
    for (const item of result.starterItems || []) {
      const cleanText = item.text.trim().toLowerCase();
      const existing = await collections.items.findOne({
        userId: session.userId,
        text: { $regex: new RegExp(`^${cleanText}$`, 'i') },
      });

      if (!existing) {
        const insertRes = await collections.items.insertOne({
          userId: session.userId,
          type: item.type,
          text: item.text,
          gloss: item.gloss,
          cefrLevel: item.cefrLevel,
          topicTags: ['placement_starter'],
          stage: 'recognition',
          recognition: createInitialFsrsCard(),
          production: null,
          createdAt: now,
        });
        starterItemIds.push(insertRes.insertedId);
      } else {
        starterItemIds.push(existing._id!);
      }
    }

    // 3. Save placement note in notes collection
    await collections.notes.insertOne({
      userId: session.userId,
      kind: 'next_step',
      text: `Placement Assessment: Floor at ${result.floorLevel}, Ceiling at ${result.ceilingLevel}. Focus: ${result.summary.nextSteps}`,
      priority: 3,
      status: 'open',
      sourceSessionId: session._id,
      createdAt: now,
    });

    // 4. Update session
    await collections.sessions.updateOne(
      { _id: session._id },
      {
        $set: {
          summary: {
            ...result.summary,
            level: result.level,
            floorLevel: result.floorLevel,
            ceilingLevel: result.ceilingLevel,
          },
          itemsIntroduced: starterItemIds,
          analysisStatus: 'done',
        },
      }
    );

    console.log(`Placement interview evaluated for user ${session.userId}: ${result.level.overall}`);
    return result;
  } catch (error) {
    console.error('Placement analysis error:', error);
    await collections.sessions.updateOne(
      { _id: sessionId },
      { $set: { analysisStatus: 'failed' } }
    );
    return null;
  }
}
