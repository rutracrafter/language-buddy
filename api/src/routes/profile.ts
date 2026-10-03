import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getCollections } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

const updateProfileSchema = z.object({
  nativeLanguage: z.string().trim().min(1).optional(),
  targetLanguage: z.string().trim().min(1).optional(),
  level: z
    .object({
      overall: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
      speaking: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
      listening: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    })
    .optional(),
  interests: z.array(z.string().trim()).optional(),
  preferences: z
    .object({
      speechRate: z.number().min(0.5).max(1.5).optional(),
      nativeLangSupport: z.enum(['low', 'med', 'high']).optional(),
      defaultSessionMinutes: z.number().min(5).max(30).optional(),
    })
    .optional(),
});

profileRouter.get('/', async (req: Request, res: Response) => {
  try {
    const collections = getCollections();
    const profile = await collections.profiles.findOne({ userId: req.userId! });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

profileRouter.put('/', async (req: Request, res: Response) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const collections = getCollections();
    const updates = parseResult.data;

    const setObj: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.nativeLanguage) setObj.nativeLanguage = updates.nativeLanguage;
    if (updates.targetLanguage) setObj.targetLanguage = updates.targetLanguage;
    if (updates.level) setObj.level = updates.level;
    if (updates.interests) setObj.interests = updates.interests;
    if (updates.preferences) {
      // Merge preferences
      for (const [key, value] of Object.entries(updates.preferences)) {
        setObj[`preferences.${key}`] = value;
      }
    }

    const updated = await collections.profiles.findOneAndUpdate(
      { userId: req.userId! },
      { $set: setObj },
      { returnDocument: 'after' }
    );

    res.json({ profile: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
