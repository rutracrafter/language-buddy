import { Router, Request, Response } from 'express';
import { getDB } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDB();
    await db.command({ ping: 1 });
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});
