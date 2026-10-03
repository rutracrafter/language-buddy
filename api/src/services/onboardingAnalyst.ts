import { GoogleGenAI, Type } from '@google/genai';
import { CEFRLevel } from '../types.js';

export interface OnboardingAnalysisResult {
  learnerName: string;
  priorStudy: string;
  comfortLevel: string;
  assessedCefrLevel: CEFRLevel;
  cefrExplanation: string;
  firstWordLearned: string;
  firstWordGloss: string;
  summary: string;
}

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeOnboardingCall(params: {
  transcript: Array<{ speaker: 'learner' | 'agent'; text: string }>;
  nativeLanguage: string;
  targetLanguage: string;
  ageRange: string;
}): Promise<OnboardingAnalysisResult> {
  const { transcript, nativeLanguage, targetLanguage, ageRange } = params;

  const transcriptText = transcript
    .map((t) => `${t.speaker === 'learner' ? 'Learner' : 'Buddy'}: ${t.text}`)
    .join('\n');

  const ai = getGenAI();

  const prompt = `You are the Onboarding Evaluator for Language Buddy.
Analyze this very first introductory conversation between a prospective learner and Buddy.

CONTEXT:
- Target Language: ${targetLanguage}
- Native / Support Language: ${nativeLanguage}
- Age Range: ${ageRange}

CONVERSATION TRANSCRIPT:
${transcriptText || 'No speech recorded'}

TASK:
Extract the learner's profile from what they said:
1. Learner name (if mentioned, e.g. "Artur"; if not mentioned, return "there" or "friend").
2. Prior study / background (e.g. "Brand new beginner", "Studied in school", "Duolingo for a few months").
3. Comfort level (e.g. "Eager but nervous", "Comfortable with basics", "Cautious").
4. Starting CEFR Level (A1, A2, B1, B2, C1) based on their self-report and any target language speech.
5. Plain English one-sentence explanation of what this level means for them.
6. The first word or phrase practiced or learned in ${targetLanguage} (e.g. "Hola", "Konnichiwa", "Merci", etc.) along with its English meaning.
7. A short, uplifting 1-to-2 sentence personalized summary for their profile.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            learnerName: { type: Type.STRING },
            priorStudy: { type: Type.STRING },
            comfortLevel: { type: Type.STRING },
            assessedCefrLevel: {
              type: Type.STRING,
              enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
            },
            cefrExplanation: { type: Type.STRING },
            firstWordLearned: { type: Type.STRING },
            firstWordGloss: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: [
            'learnerName',
            'priorStudy',
            'comfortLevel',
            'assessedCefrLevel',
            'cefrExplanation',
            'firstWordLearned',
            'firstWordGloss',
            'summary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      learnerName: parsed.learnerName || 'Friend',
      priorStudy: parsed.priorStudy || 'Starting fresh',
      comfortLevel: parsed.comfortLevel || 'Ready to practice',
      assessedCefrLevel: (parsed.assessedCefrLevel as CEFRLevel) || 'A1',
      cefrExplanation:
        parsed.cefrExplanation ||
        'You are beginning with core everyday greetings and practical spoken phrases.',
      firstWordLearned: parsed.firstWordLearned || (targetLanguage === 'Spanish' ? 'Hola' : 'Hello'),
      firstWordGloss: parsed.firstWordGloss || 'Hello',
      summary:
        parsed.summary ||
        `Great first conversation! Buddy has calibrated your starting profile in ${targetLanguage}.`,
    };
  } catch (error) {
    console.error('Onboarding analysis error:', error);
    return {
      learnerName: 'Friend',
      priorStudy: 'Starting fresh',
      comfortLevel: 'Ready to learn',
      assessedCefrLevel: 'A1',
      cefrExplanation: 'You are starting with foundational vocabulary and conversational greetings.',
      firstWordLearned: targetLanguage === 'Spanish' ? 'Hola' : 'Hello',
      firstWordGloss: 'Hello',
      summary: `Welcome to Language Buddy! You are all set to start speaking ${targetLanguage}.`,
    };
  }
}
