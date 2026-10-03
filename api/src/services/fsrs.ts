import { fsrs, Rating, createEmptyCard, Card, Grade } from 'ts-fsrs';
import { FsrsCard } from '../types.js';

const f = fsrs();

export function createInitialFsrsCard(): FsrsCard {
  const empty = createEmptyCard();
  return {
    due: empty.due,
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    state: empty.state,
    last_review: empty.last_review,
  };
}

export function mapOutcomeToRating(outcome: 'again' | 'hard' | 'good' | 'easy'): Grade {
  switch (outcome) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
    default:
      return Rating.Good;
  }
}

export function scheduleReview(
  existingCard: FsrsCard | null | undefined,
  outcome: 'again' | 'hard' | 'good' | 'easy',
  reviewDate: Date = new Date()
): FsrsCard {
  const baseCard: Card = existingCard
    ? {
        due: new Date(existingCard.due),
        stability: existingCard.stability,
        difficulty: existingCard.difficulty,
        elapsed_days: existingCard.elapsed_days,
        scheduled_days: existingCard.scheduled_days,
        reps: existingCard.reps,
        lapses: existingCard.lapses,
        state: existingCard.state,
        learning_steps: (existingCard as any).learning_steps || 0,
        last_review: existingCard.last_review ? new Date(existingCard.last_review) : undefined,
      }
    : createEmptyCard(reviewDate);

  const grade = mapOutcomeToRating(outcome);
  const scheduling = f.repeat(baseCard, reviewDate);
  const resultCard = scheduling[grade].card;

  return {
    due: resultCard.due,
    stability: resultCard.stability,
    difficulty: resultCard.difficulty,
    elapsed_days: resultCard.elapsed_days,
    scheduled_days: resultCard.scheduled_days,
    reps: resultCard.reps,
    lapses: resultCard.lapses,
    state: resultCard.state,
    last_review: resultCard.last_review,
  };
}
