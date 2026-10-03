import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getCollections } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { Session, TranscriptLine } from '../types.js';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

const startSessionSchema = z.object({
  targetMinutes: z.number().min(1).max(30).optional().default(10),
  nativeLanguage: z.string().trim().min(1).optional(),
  targetLanguage: z.string().trim().min(1).optional(),
  topic: z.string().trim().min(1).optional(),
});

const finishSessionSchema = z.object({
  transcript: z.array(
    z.object({
      speaker: z.enum(['learner', 'agent']),
      text: z.string(),
      lang: z.string().default('unknown'),
      at: z.string().or(z.date()),
    })
  ),
  toolEvents: z.array(z.record(z.unknown())).optional().default([]),
});

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the backend');
  }
  return new GoogleGenAI({ apiKey });
}

function buildSystemInstruction(
  nativeLanguage: string,
  targetLanguage: string,
  level: string,
  topic: string
): string {
  return `You are Language Buddy, a friendly, encouraging personal voice tutor helping the learner practice speaking.

LANGUAGE RULES:
- The learner's native/support language is: ${nativeLanguage}.
- The target language being practiced is: ${targetLanguage}.
- You must strictly use ONLY these two languages. Never speak in any third language.
- Conversational practice is primarily conducted in ${targetLanguage}.

CODE-SWITCHING RULE:
- The learner is allowed to ask questions in their native language (${nativeLanguage}) at any time (such as "What does that word mean?", "How do you say...", or asking for clarification).
- When the learner asks a question in ${nativeLanguage}, answer their question clearly and concisely in ${nativeLanguage}.
- Immediately after answering in ${nativeLanguage}, smoothly prompt the learner to resume speaking in ${targetLanguage}.

LEVEL & PACING (CEFR ${level}):
- The learner's current target level is CEFR ${level}.
- Speak naturally at this level: keep your turns concise (1 to 3 short sentences at a time) so the learner has ample space to speak and is not overwhelmed.
- Use clear pronunciation, natural pacing, and accessible vocabulary appropriate for ${level}.

SESSION TOPIC:
- Topic: ${topic}.
- Start the conversation with a warm, welcoming greeting in ${targetLanguage} and ask an easy, engaging opening question related to the topic.`;
}

// POST /api/sessions/start — Issue ephemeral Live API token & create session
sessionsRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const parseResult = startSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { targetMinutes, topic: requestedTopic } = parseResult.data;
    const collections = getCollections();

    const profile = await collections.profiles.findOne({ userId: req.userId! });
    const nativeLanguage = parseResult.data.nativeLanguage || profile?.nativeLanguage || 'English';
    const targetLanguage = parseResult.data.targetLanguage || profile?.targetLanguage || 'Spanish';
    const cefrLevel = profile?.level?.overall || 'A1';
    const topic = requestedTopic || 'Everyday life, introductions, and favorite foods';

    const systemInstruction = buildSystemInstruction(
      nativeLanguage,
      targetLanguage,
      cefrLevel,
      topic
    );

    const client = getGenAIClient();
    const expireTime = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const authToken = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    if (!authToken || !authToken.name) {
      throw new Error('Failed to obtain ephemeral token name from Gemini API');
    }

    const now = new Date();
    const sessionDoc: Session = {
      userId: req.userId!,
      type: 'practice',
      languages: {
        native: nativeLanguage,
        target: targetLanguage,
      },
      targetMinutes,
      startedAt: now,
      plan: {
        topic,
        cefrLevel,
        systemInstruction,
      },
      transcript: [],
      toolEvents: [],
      analysisStatus: 'pending',
    };

    const sessionResult = await collections.sessions.insertOne(sessionDoc);

    res.status(201).json({
      sessionId: sessionResult.insertedId.toHexString(),
      token: authToken.name,
      model: 'gemini-3.8-live',
      systemInstruction,
      targetMinutes,
      languages: {
        native: nativeLanguage,
        target: targetLanguage,
      },
      level: cefrLevel,
      topic,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start Live session',
    });
  }
});

// POST /api/sessions/:id/finish — Save transcript and complete session
sessionsRouter.post('/:id/finish', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const sessionIdStr = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    const parseResult = finishSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { transcript, toolEvents } = parseResult.data;
    const collections = getCollections();
    const sessionId = new ObjectId(sessionIdStr);

    const session = await collections.sessions.findOne({
      _id: sessionId,
      userId: req.userId!,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const formattedTranscript: TranscriptLine[] = transcript.map((line) => ({
      speaker: line.speaker,
      text: line.text,
      lang: line.lang,
      at: new Date(line.at),
    }));

    await collections.sessions.updateOne(
      { _id: sessionId },
      {
        $set: {
          endedAt: new Date(),
          transcript: formattedTranscript,
          toolEvents: toolEvents || [],
          analysisStatus: 'done',
        },
      }
    );

    res.json({
      ok: true,
      sessionId: sessionIdStr,
      transcriptLength: formattedTranscript.length,
    });
  } catch (error) {
    console.error('Finish session error:', error);
    res.status(500).json({ error: 'Failed to record session end' });
  }
});

// GET /api/sessions/recent — Return recent sessions for history display
sessionsRouter.get('/recent', async (req: Request, res: Response) => {
  try {
    const collections = getCollections();
    const sessions = await collections.sessions
      .find({ userId: req.userId! })
      .sort({ startedAt: -1 })
      .limit(10)
      .toArray();

    res.json({ sessions });
  } catch (error) {
    console.error('Get recent sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions history' });
  }
});

// GET /api/sessions/:id — Return a single session
sessionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const sessionIdStr = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    const collections = getCollections();
    const session = await collections.sessions.findOne({
      _id: new ObjectId(sessionIdStr),
      userId: req.userId!,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});
