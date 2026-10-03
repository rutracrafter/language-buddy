import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getCollections } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { Session, TranscriptLine } from '../types.js';
import { generateSessionPlan } from '../services/planner.js';
import { runAnalyst } from '../services/analyst.js';
import { buildPlacementSystemInstruction, runPlacementAnalyst } from '../services/placement.js';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

const startSessionSchema = z.object({
  type: z.enum(['placement', 'practice']).optional().default('practice'),
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

// POST /api/sessions/start — Run Planner, issue ephemeral Live token & create session
sessionsRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const parseResult = startSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { type, targetMinutes, topic: requestedTopic, nativeLanguage, targetLanguage } =
      parseResult.data;
    const collections = getCollections();

    const profile = await collections.profiles.findOne({ userId: req.userId! });
    const userNative = nativeLanguage || profile?.nativeLanguage || 'English';
    const userTarget = targetLanguage || profile?.targetLanguage || 'Spanish';
    const cefrLevel = profile?.level?.overall || 'A1';

    let systemInstruction = '';
    let planData: Record<string, unknown> = {};
    let sessionTopic = requestedTopic || 'Everyday conversation';

    if (type === 'placement') {
      systemInstruction = buildPlacementSystemInstruction(userNative, userTarget, cefrLevel);
      sessionTopic = 'ACTFL OPI Oral Proficiency Placement Interview';
      planData = {
        type: 'placement',
        topic: sessionTopic,
        cefrLevel,
        systemInstruction,
      };
    } else {
      // 1. Run the AI Planner to produce a customized session plan & system instruction
      const plan = await generateSessionPlan(req.userId!, {
        targetMinutes,
        nativeLanguage: userNative,
        targetLanguage: userTarget,
        requestedTopic,
      });

      systemInstruction = plan.systemInstruction;
      sessionTopic = plan.topic;
      planData = {
        type: 'practice',
        topic: plan.topic,
        goal: plan.goal,
        cefrLevel: plan.cefrLevel,
        dueItemsToWeave: plan.dueItemsToWeave,
        newItemsToIntroduce: plan.newItemsToIntroduce,
        errorPatternsToAddress: plan.errorPatternsToAddress,
        systemInstruction: plan.systemInstruction,
      };
    }

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
      type,
      languages: {
        native: userNative,
        target: userTarget,
      },
      targetMinutes: type === 'placement' ? 8 : targetMinutes,
      startedAt: now,
      plan: planData,
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
      targetMinutes: sessionDoc.targetMinutes,
      languages: sessionDoc.languages,
      level: cefrLevel,
      topic: sessionTopic,
      type,
      plan: planData,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start Live session',
    });
  }
});

// POST /api/sessions/:id/finish — Save transcript, toolEvents, run Analyst & complete session
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
        },
      }
    );

    // Run appropriate AI Analyst (Placement Analyst or Practice Analyst)
    let analysis: any = null;
    if (session.type === 'placement') {
      analysis = await runPlacementAnalyst(sessionId);
    } else {
      analysis = await runAnalyst(sessionId);
    }

    res.json({
      ok: true,
      sessionId: sessionIdStr,
      transcriptLength: formattedTranscript.length,
      analysis: analysis || null,
      sessionType: session.type,
    });
  } catch (error) {
    console.error('Finish session error:', error);
    res.status(500).json({ error: 'Failed to record session end' });
  }
});

// POST /api/sessions/:id/analyze — Retry analyst run on existing session transcript
sessionsRouter.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const sessionIdStr = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

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

    let analysis: any = null;
    if (session.type === 'placement') {
      analysis = await runPlacementAnalyst(sessionId);
    } else {
      analysis = await runAnalyst(sessionId);
    }

    res.json({ ok: true, sessionId: sessionIdStr, analysis });
  } catch (error) {
    console.error('Retry analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze session' });
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
