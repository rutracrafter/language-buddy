import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getCollections } from '../db.js';
import { createSession, destroySession, requireAuth, SESSION_COOKIE_NAME } from '../middleware/auth.js';
import { LearnerProfile, CEFRLevel } from '../types.js';
import { createInitialFsrsCard } from '../services/fsrs.js';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  nativeLanguage: z.string().trim().min(1).default('English'),
  targetLanguage: z.string().trim().min(1).default('Spanish'),
  ageRange: z.string().optional(),
  priorStudy: z.string().optional(),
  comfortLevel: z.string().optional(),
  initialLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional().default('A1'),
  firstWordLearned: z.string().optional(),
  firstWordGloss: z.string().optional(),
  onboardingTranscript: z
    .array(
      z.object({
        speaker: z.enum(['learner', 'agent']),
        text: z.string(),
      })
    )
    .optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const {
      email,
      password,
      nativeLanguage,
      targetLanguage,
      ageRange,
      priorStudy,
      comfortLevel,
      initialLevel,
      firstWordLearned,
      firstWordGloss,
      onboardingTranscript,
    } = parseResult.data;

    const collections = getCollections();

    const existingUser = await collections.users.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date();

    const userResult = await collections.users.insertOne({
      email,
      passwordHash,
      createdAt: now,
    });

    const newProfile: LearnerProfile = {
      userId: userResult.insertedId,
      nativeLanguage,
      targetLanguage,
      level: {
        overall: initialLevel,
        speaking: initialLevel,
        listening: initialLevel,
      },
      levelConfidence: initialLevel !== 'A1' ? 0.35 : 0.2,
      placementCompletedAt: null,
      interests: [],
      preferences: {
        speechRate: 1.0,
        nativeLangSupport: 'med',
      },
      ageRange,
      priorStudy,
      comfortLevel,
      firstWordLearned,
      createdAt: now,
      updatedAt: now,
    };

    await collections.profiles.insertOne(newProfile);

    // If a first word was learned during onboarding, persist to items collection
    if (firstWordLearned) {
      await collections.items.insertOne({
        userId: userResult.insertedId,
        type: 'vocab',
        text: firstWordLearned,
        gloss: firstWordGloss || 'First word learned',
        cefrLevel: initialLevel,
        topicTags: ['onboarding_first_word'],
        stage: 'recognition',
        recognition: createInitialFsrsCard(),
        production: null,
        createdAt: now,
      });
    }

    // If an onboarding transcript was recorded, record the session in history
    if (onboardingTranscript && onboardingTranscript.length > 0) {
      await collections.sessions.insertOne({
        userId: userResult.insertedId,
        type: 'practice',
        languages: { native: nativeLanguage, target: targetLanguage },
        targetMinutes: 5,
        startedAt: now,
        endedAt: now,
        plan: { topic: 'Introductory feel-out conversation with Buddy' },
        transcript: onboardingTranscript.map((t) => ({
          speaker: t.speaker,
          text: t.text,
          lang: 'auto',
          at: now,
        })),
        toolEvents: [],
        analysisStatus: 'done',
      });
    }

    await createSession(userResult.insertedId, res);

    res.status(201).json({
      user: {
        id: userResult.insertedId.toHexString(),
        email,
      },
      profile: newProfile,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const collections = getCollections();

    const user = await collections.users.findOne({ email });
    if (!user || !user._id) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await createSession(user._id, res);
    const profile = await collections.profiles.findOne({ userId: user._id });

    res.json({
      user: {
        id: user._id.toHexString(),
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    await destroySession(token, res);
    res.json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({
    user: req.user,
    profile: req.profile,
  });
});
