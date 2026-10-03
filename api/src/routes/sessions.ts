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
import { buildFirstCallSystemInstruction } from '../services/firstCallPrompt.js';
import { analyzeOnboardingCall } from '../services/onboardingAnalyst.js';
import { createInitialFsrsCard } from '../services/fsrs.js';

export const sessionsRouter = Router();

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the backend');
  }
  return new GoogleGenAI({ apiKey });
}

const onboardingStartSchema = z.object({
  nativeLanguage: z.string().trim().min(1).default('English'),
  targetLanguage: z.string().trim().min(1).default('Spanish'),
  ageRange: z.string().trim().default('26 to 40'),
  speechRate: z.number().min(0.5).max(1.5).optional().default(0.9),
});

const onboardingAnalyzeSchema = z.object({
  transcript: z.array(
    z.object({
      speaker: z.enum(['learner', 'agent']),
      text: z.string(),
    })
  ),
  nativeLanguage: z.string().trim().default('English'),
  targetLanguage: z.string().trim().default('Spanish'),
  ageRange: z.string().trim().default('26 to 40'),
});

// PUBLIC ENDPOINTS (for prospective learners during onboarding before account signup)

// POST /api/sessions/onboarding-start
sessionsRouter.post('/onboarding-start', async (req: Request, res: Response) => {
  try {
    const parseResult = onboardingStartSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { nativeLanguage, targetLanguage, ageRange, speechRate } = parseResult.data;

    const systemInstruction = buildFirstCallSystemInstruction(
      nativeLanguage,
      targetLanguage,
      ageRange,
      speechRate
    );

    const client = getGenAIClient();
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
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
      throw new Error('Failed to obtain ephemeral token from Gemini API');
    }

    res.status(201).json({
      token: authToken.name,
      model: 'gemini-3.8-live',
      systemInstruction,
      nativeLanguage,
      targetLanguage,
      ageRange,
      speechRate,
    });
  } catch (error) {
    console.error('Onboarding start error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start onboarding voice call',
    });
  }
});

// POST /api/sessions/onboarding-analyze
sessionsRouter.post('/onboarding-analyze', async (req: Request, res: Response) => {
  try {
    const parseResult = onboardingAnalyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const analysis = await analyzeOnboardingCall(parseResult.data);
    res.json({ analysis });
  } catch (error) {
    console.error('Onboarding analyze error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze onboarding conversation',
    });
  }
});

// AUTH-PROTECTED ENDPOINTS (requires active user login)
sessionsRouter.use(requireAuth);

const startSessionSchema = z.object({
  type: z.enum(['placement', 'practice', 'first_call']).optional().default('practice'),
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
    const speechRate = profile?.preferences?.speechRate ?? 1.0;

    let systemInstruction = '';
    let planData: Record<string, unknown> = {};
    let sessionTopic = requestedTopic || 'Everyday conversation';

    if (type === 'placement') {
      systemInstruction = buildPlacementSystemInstruction(userNative, userTarget, cefrLevel, speechRate);
      sessionTopic = 'ACTFL OPI Oral Proficiency Placement Interview';
      planData = {
        type: 'placement',
        topic: sessionTopic,
        cefrLevel,
        systemInstruction,
      };
    } else if (type === 'first_call') {
      const ageRange = profile?.ageRange || '26 to 40';
      systemInstruction = buildFirstCallSystemInstruction(userNative, userTarget, ageRange, speechRate);
      sessionTopic = `Meet Buddy & First Chat (${userTarget})`;
      planData = {
        type: 'first_call',
        topic: sessionTopic,
        cefrLevel: 'A1',
        systemInstruction,
      };
    } else {
      // 1. Run the AI Planner to produce a customized session plan & system instruction
      const plan = await generateSessionPlan(req.userId!, {
        targetMinutes,
        nativeLanguage: userNative,
        targetLanguage: userTarget,
        requestedTopic,
        speechRate,
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
      speechRate,
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

    // Run appropriate AI Analyst (Placement Analyst, Onboarding First Call, or Practice Analyst)
    let analysis: any = null;
    if (session.type === 'placement') {
      analysis = await runPlacementAnalyst(sessionId);
    } else if (session.type === 'first_call') {
      const profile = await collections.profiles.findOne({ userId: req.userId! });
      const ageRange = profile?.ageRange || '26 to 40';
      analysis = await analyzeOnboardingCall({
        transcript: formattedTranscript.map((t) => ({ speaker: t.speaker, text: t.text })),
        nativeLanguage: session.languages.native,
        targetLanguage: session.languages.target,
        ageRange,
      });

      // Update profile with first-call insights
      if (analysis) {
        const updateFields: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (analysis.priorStudy) updateFields.priorStudy = analysis.priorStudy;
        if (analysis.comfortLevel) updateFields.comfortLevel = analysis.comfortLevel;
        if (analysis.assessedCefrLevel) {
          updateFields['level.overall'] = analysis.assessedCefrLevel;
          updateFields['level.speaking'] = analysis.assessedCefrLevel;
          updateFields['level.listening'] = analysis.assessedCefrLevel;
        }
        if (analysis.firstWordLearned) {
          updateFields.firstWordLearned = analysis.firstWordLearned;
          // Also insert starter item into items collection
          const cleanWord = analysis.firstWordLearned.trim().toLowerCase();
          const existingItem = await collections.items.findOne({
            userId: req.userId!,
            text: { $regex: new RegExp(`^${cleanWord}$`, 'i') },
          });
          if (!existingItem) {
            await collections.items.insertOne({
              userId: req.userId!,
              type: 'vocab',
              text: analysis.firstWordLearned,
              gloss: analysis.firstWordGloss || 'First word learned',
              cefrLevel: analysis.assessedCefrLevel || 'A1',
              topicTags: ['onboarding_first_word'],
              stage: 'recognition',
              recognition: createInitialFsrsCard(),
              production: null,
              createdAt: new Date(),
            });
          }
        }
        await collections.profiles.updateOne({ userId: session.userId }, { $set: updateFields });
      }

      await collections.sessions.updateOne(
        { _id: sessionId },
        {
          $set: {
            summary: analysis,
            analysisStatus: 'done',
          },
        }
      );
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
