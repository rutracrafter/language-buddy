import { ObjectId } from 'mongodb';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface LearnerPreferences {
  speechRate: number; // e.g. 0.8 to 1.2
  nativeLangSupport: 'low' | 'med' | 'high';
  defaultSessionMinutes?: number; // optional, open-ended
}

export interface LearnerProfile {
  _id?: ObjectId;
  userId: ObjectId;
  nativeLanguage: string;
  targetLanguage: string;
  level: {
    overall: CEFRLevel;
    speaking: CEFRLevel;
    listening: CEFRLevel;
  };
  levelConfidence: number; // 0 to 1
  placementCompletedAt: Date | null;
  interests: string[];
  preferences: LearnerPreferences;
  createdAt?: Date;
  updatedAt: Date;
}

export interface FsrsCard {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  last_review?: Date;
}

export interface LearningItem {
  _id?: ObjectId;
  userId: ObjectId;
  type: 'vocab' | 'phrase' | 'grammar';
  text: string;
  gloss: string;
  cefrLevel: CEFRLevel;
  topicTags: string[];
  firstSeenExample?: string;
  stage: 'recognition' | 'production';
  recognition: FsrsCard;
  production: FsrsCard | null;
  createdAt: Date;
}

export interface ReviewEvent {
  _id?: ObjectId;
  userId: ObjectId;
  itemId: ObjectId;
  sessionId: ObjectId;
  skill: 'recognition' | 'production';
  outcome: 'again' | 'hard' | 'good' | 'easy';
  evidence: string;
  source: 'agent_tool' | 'analyst';
  at: Date;
}

export interface TopicCoverage {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  cefrLevel: CEFRLevel;
  depth: 0 | 1 | 2 | 3; // introduced / practiced / comfortable / mastered
  sessionsCount: number;
  lastCoveredAt: Date;
  notes?: string;
}

export interface BuildOnNote {
  _id?: ObjectId;
  userId: ObjectId;
  kind: 'error_pattern' | 'next_step' | 'interest';
  text: string;
  priority: number;
  status: 'open' | 'addressed';
  sourceSessionId?: ObjectId;
  createdAt: Date;
}

export interface TranscriptLine {
  speaker: 'learner' | 'agent';
  text: string;
  lang: string;
  at: Date;
}

export interface Session {
  _id?: ObjectId;
  userId: ObjectId;
  type: 'placement' | 'practice';
  languages: {
    native: string;
    target: string;
  };
  targetMinutes: number;
  startedAt: Date;
  endedAt?: Date;
  plan?: Record<string, unknown>;
  transcript: TranscriptLine[];
  toolEvents: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  itemsReviewed?: ObjectId[];
  itemsIntroduced?: ObjectId[];
  analysisStatus: 'pending' | 'done' | 'failed';
}

export interface AuthSession {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}
