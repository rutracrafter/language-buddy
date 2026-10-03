import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCollections } from '../db.js';
import { User, LearnerProfile } from '../types.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: ObjectId;
      profile?: LearnerProfile | null;
    }
  }
}

export const SESSION_COOKIE_NAME = 'lb_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // Allow secure cookies to be controlled via COOKIE_SECURE env var
  const isSecure = process.env.COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecure,
    path: '/',
    maxAge: SESSION_DURATION_MS,
  };
}

export async function createSession(userId: ObjectId, res: Response): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const collections = getCollections();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await collections.authSessions.insertOne({
    token,
    userId,
    createdAt: now,
    expiresAt,
  });

  res.cookie(SESSION_COOKIE_NAME, token, getCookieOptions());
  return token;
}

export async function destroySession(token: string | undefined, res: Response): Promise<void> {
  if (token) {
    const collections = getCollections();
    await collections.authSessions.deleteOne({ token });
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return next();
  }

  try {
    const collections = getCollections();
    const session = await collections.authSessions.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return next();
    }

    const user = await collections.users.findOne({ _id: session.userId });
    if (!user || !user._id) {
      return next();
    }

    req.userId = user._id;
    req.user = {
      id: user._id.toHexString(),
      email: user.email,
    };

    const profile = await collections.profiles.findOne({ userId: user._id });
    req.profile = profile;

    next();
  } catch (err) {
    console.error('Error in auth middleware:', err);
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
