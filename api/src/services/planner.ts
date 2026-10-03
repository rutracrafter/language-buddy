import { GoogleGenAI, Type } from '@google/genai';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { LearnerProfile, BuildOnNote, TopicCoverage, LearningItem } from '../types.js';
import { getLanguagePacingGuidelines } from './languageGuidelines.js';

export interface SessionPlan {
  topic: string;
  goal: string;
  cefrLevel: string;
  dueItemsToWeave: string[];
  newItemsToIntroduce: Array<{ text: string; gloss: string }>;
  errorPatternsToAddress: string[];
  systemInstruction: string;
}

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateSessionPlan(
  userId: ObjectId,
  options: {
    targetMinutes?: number;
    nativeLanguage?: string;
    targetLanguage?: string;
    requestedTopic?: string;
    speechRate?: number;
  }
): Promise<SessionPlan> {
  const collections = getCollections();

  const profile = await collections.profiles.findOne({ userId });
  const nativeLanguage = options.nativeLanguage || profile?.nativeLanguage || 'English';
  const targetLanguage = options.targetLanguage || profile?.targetLanguage || 'Spanish';
  const cefrLevel = profile?.level?.overall || 'A1';
  const speechRate = options.speechRate || profile?.preferences?.speechRate || 1.0;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Enforce caps: max 12 new items per day
  const itemsIntroducedToday = await collections.items.countDocuments({
    userId,
    createdAt: { $gte: startOfDay },
  });
  const maxNewItemsAllowed = Math.min(3, Math.max(0, 12 - itemsIntroducedToday));

  // Spaced repetition: select items currently due for review
  const dueItems = await collections.items
    .find({
      userId,
      $or: [
        { stage: 'production', 'production.due': { $lte: now } },
        { stage: 'recognition', 'recognition.due': { $lte: now } },
      ],
    })
    .sort({ 'production.due': 1, 'recognition.due': 1 })
    .limit(6)
    .toArray();

  // Gather learner history
  const openNotes = await collections.notes
    .find({ userId, status: 'open' })
    .sort({ priority: -1 })
    .limit(5)
    .toArray();

  const coveredTopics = await collections.topics
    .find({ userId })
    .sort({ lastCoveredAt: -1 })
    .limit(5)
    .toArray();

  const recentItems = await collections.items
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const ai = getGenAI();

  const prompt = `You are the Session Planner for an audio-first language learning system.
Plan the next spoken practice conversation for this learner.

LEARNER PROFILE:
- Native Language: ${nativeLanguage}
- Target Language: ${targetLanguage}
- CEFR Level: ${cefrLevel}
- Session Format: Open-ended, natural conversation for as long as the learner wishes
- Requested Topic: ${options.requestedTopic || 'None specified'}

FSRS SPACED REPETITION QUEUE:
- Items Due for Review Today (${dueItems.length}):
${dueItems.length ? dueItems.map((i) => `- "${i.text}" (${i.gloss}, stage: ${i.stage})`).join('\n') : '- No SRS reviews currently due'}
- Max New Items Budget Allowed: ${maxNewItemsAllowed} (Daily items so far: ${itemsIntroducedToday}/12)

RECENT TOPICS COVERED:
${coveredTopics.length ? coveredTopics.map((t) => `- ${t.name} (depth: ${t.depth}/3)`).join('\n') : '- No topics covered yet'}

OPEN WEAK SPOTS / BUILD-ON NOTES:
${openNotes.length ? openNotes.map((n) => `- [${n.kind}] ${n.text}`).join('\n') : '- None logged yet'}

KNOWN RECENT VOCABULARY ITEMS:
${recentItems.length ? recentItems.map((i) => `- "${i.text}" (${i.gloss})`).join('\n') : '- None yet'}

PLANNING REQUIREMENTS:
1. Choose an appropriate topic fitting CEFR ${cefrLevel} (or honor the requested topic if provided).
2. Set a clear, practical spoken goal (e.g., ordering food, describing weekend routine, sharing opinions).
3. Weave in the due review items and gently address open weak spots if relevant.
4. Select up to ${maxNewItemsAllowed} new words or phrases to introduce (0 if budget is 0).
5. Create a concise, natural opening greeting and question for the tutor.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            goal: { type: Type.STRING },
            dueItemsToWeave: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            newItemsToIntroduce: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  gloss: { type: Type.STRING },
                },
                required: ['text', 'gloss'],
              },
            },
            errorPatternsToAddress: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            starterGreetingPrompt: { type: Type.STRING },
          },
          required: [
            'topic',
            'goal',
            'dueItemsToWeave',
            'newItemsToIntroduce',
            'errorPatternsToAddress',
            'starterGreetingPrompt',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const topic = parsed.topic || options.requestedTopic || 'Everyday life and introductions';
    const goal = parsed.goal || 'Practice conversational greetings and basic exchanges';
    const weavedDueItems = parsed.dueItemsToWeave || [];
    const newItems = (parsed.newItemsToIntroduce || []).slice(0, maxNewItemsAllowed);
    const weakSpots = parsed.errorPatternsToAddress || [];

    const pacingGuidelines = getLanguagePacingGuidelines(nativeLanguage, targetLanguage, speechRate);

    const systemInstruction = `You are Language Buddy, a friendly, encouraging personal voice tutor helping the learner practice speaking.

LANGUAGE RULES:
- The learner's native/support language is: ${nativeLanguage}.
- The target language being practiced is: ${targetLanguage}.
- Strictly use ONLY these two languages. Never use any third language.
- Spoken practice is conducted primarily in ${targetLanguage}.

${pacingGuidelines}

LEVEL & PACING (CEFR ${cefrLevel}):
- Speak at CEFR ${cefrLevel}.
- Keep turns concise (1 to 2 short sentences at a time) so the learner has ample space to speak and is not overwhelmed.
- Pronounce clearly with accessible vocabulary suitable for ${cefrLevel}.

SESSION PLAN & GOAL:
- Topic: ${topic}
- Goal: ${goal}
${weavedDueItems.length ? `- Due items to weave into conversation: ${weavedDueItems.join(', ')}` : ''}
${newItems.length ? `- New items to introduce: ${newItems.map((i: any) => `"${i.text}" (${i.gloss})`).join(', ')}` : ''}
${weakSpots.length ? `- Weak spots to gently reinforce if errors occur: ${weakSpots.join(', ')}` : ''}

AGENT TOOLS TO CALL:
- Call log_item_event(text, skill, outcome, evidence) when the learner demonstrates understanding ("recognition") or successfully uses ("production") a vocabulary item or grammar pattern.
- Call log_error(text, note) when the learner makes a noteworthy grammar, pronunciation, or word choice mistake.

CONVERSATION FLOW:
- This is a natural, open-ended conversation for however long the learner wants to chat.
- Keep the dialogue flowing comfortably and responsively. Do not rush to wrap up or urge the user to stop; let the learner conclude when they are ready.

START OF SESSION:
- Open by greeting the learner warmly in ${targetLanguage} and asking an engaging initial question related to the topic!`;

    return {
      topic,
      goal,
      cefrLevel,
      dueItemsToWeave: weavedDueItems,
      newItemsToIntroduce: newItems,
      errorPatternsToAddress: weakSpots,
      systemInstruction,
    };
  } catch (error) {
    console.error('Planner error, falling back to default plan:', error);
    const topic = options.requestedTopic || 'Everyday life and introductions';
    const systemInstruction = `You are Language Buddy, a friendly voice tutor.
Speak in ${targetLanguage} at CEFR ${cefrLevel}. The learner's native language is ${nativeLanguage}.
Answer any ${nativeLanguage} questions in ${nativeLanguage}, then return to ${targetLanguage}.
Topic: ${topic}. Greet the learner warmly and start the conversation!`;

    return {
      topic,
      goal: 'Conversational fluency and speaking practice',
      cefrLevel,
      dueItemsToWeave: [],
      newItemsToIntroduce: [],
      errorPatternsToAddress: [],
      systemInstruction,
    };
  }
}
