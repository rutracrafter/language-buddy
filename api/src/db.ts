import { MongoClient, Db, Collection } from 'mongodb';
import {
  User,
  LearnerProfile,
  LearningItem,
  ReviewEvent,
  TopicCoverage,
  BuildOnNote,
  Session,
  AuthSession,
} from './types.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(uri: string): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  console.log(`Connected to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  await ensureIndexes(db);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export function getCollections() {
  const database = getDB();
  return {
    users: database.collection<User>('users'),
    profiles: database.collection<LearnerProfile>('profiles'),
    items: database.collection<LearningItem>('items'),
    reviews: database.collection<ReviewEvent>('reviews'),
    topics: database.collection<TopicCoverage>('topics'),
    notes: database.collection<BuildOnNote>('notes'),
    sessions: database.collection<Session>('sessions'),
    authSessions: database.collection<AuthSession>('auth_sessions'),
  };
}

export async function ensureIndexes(database: Db): Promise<void> {
  const users = database.collection<User>('users');
  await users.createIndex({ email: 1 }, { unique: true });

  const profiles = database.collection<LearnerProfile>('profiles');
  await profiles.createIndex({ userId: 1 }, { unique: true });

  const items = database.collection<LearningItem>('items');
  await items.createIndex({ userId: 1, 'recognition.due': 1 });
  await items.createIndex({ userId: 1, 'production.due': 1 });

  const reviews = database.collection<ReviewEvent>('reviews');
  await reviews.createIndex({ userId: 1, itemId: 1, at: 1 });

  const topics = database.collection<TopicCoverage>('topics');
  await topics.createIndex({ userId: 1, name: 1 }, { unique: true });

  const notes = database.collection<BuildOnNote>('notes');
  await notes.createIndex({ userId: 1, status: 1 });

  const sessions = database.collection<Session>('sessions');
  await sessions.createIndex({ userId: 1, startedAt: -1 });

  const authSessions = database.collection<AuthSession>('auth_sessions');
  await authSessions.createIndex({ token: 1 }, { unique: true });
  await authSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  console.log('MongoDB indexes verified and ensured.');
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
