export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface User {
  id: string;
  email: string;
}

export interface LearnerPreferences {
  speechRate: number;
  nativeLangSupport: 'low' | 'med' | 'high';
  defaultSessionMinutes: number;
}

export interface LearnerProfile {
  _id?: string;
  userId: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: {
    overall: CEFRLevel;
    speaking: CEFRLevel;
    listening: CEFRLevel;
  };
  levelConfidence: number;
  placementCompletedAt: string | null;
  interests: string[];
  preferences: LearnerPreferences;
  createdAt?: string;
  updatedAt?: string;
}
