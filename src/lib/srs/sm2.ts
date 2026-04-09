/**
 * SM-2 Spaced Repetition Algorithm
 * Based on: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Rating scale:
 *   0 - Complete blackout
 *   1 - Incorrect, but remembered on seeing the answer
 *   2 - Incorrect, but easy recall after seeing answer
 *   3 - Correct with significant difficulty
 *   4 - Correct after hesitation
 *   5 - Perfect response
 */

export interface SM2Card {
  easeFactor: number;   // Default 2.5, min 1.3
  interval: number;     // Days until next review
  repetitions: number;  // How many times reviewed successfully
}

export interface SM2Result extends SM2Card {
  dueDate: Date;
}

const MIN_EASE_FACTOR = 1.3;

export function calculateSM2(card: SM2Card, rating: number): SM2Result {
  const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));

  let { easeFactor, interval, repetitions } = card;

  // Update ease factor
  const newEaseFactor =
    easeFactor + (0.1 - (5 - clampedRating) * (0.08 + (5 - clampedRating) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  if (clampedRating < 3) {
    // Failed recall — restart; interval 0 = due immediately (same session / soon)
    interval = 0;
    repetitions = 0;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
    repetitions += 1;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  dueDate.setHours(0, 0, 0, 0); // Midnight of the due day

  return { easeFactor, interval, repetitions, dueDate };
}

export function getDefaultSM2(): SM2Card {
  return { easeFactor: 2.5, interval: 0, repetitions: 0 };
}

/** Returns next review label for UI display */
export function getNextReviewLabel(rating: number, card: SM2Card): string {
  const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));
  if (clampedRating < 3) {
    return "Soon";
  }

  const result = calculateSM2(card, rating);
  const { interval } = result;

  if (interval === 0) return "Soon";
  if (interval === 1) return "+1 day";
  if (interval < 7) return `${interval} days`;
  if (interval < 30) return `${Math.round(interval / 7)}w`;
  if (interval < 365) return `${Math.round(interval / 30)}mo`;
  return `${Math.round(interval / 365)}y`;
}

/** Cards are due when dueDate is today or in the past */
export function isDue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dueDate <= today;
}

/**
 * Deck-level "mastered" — three successful reviews in the current streak.
 * Ease is not part of this gate: repeated "Hard" passes can push ease below 2.0
 * while repetitions ≥ 3, which would otherwise strand cards as never mastered.
 */
export function isMastered(card: Pick<SM2Card, "repetitions">): boolean {
  return card.repetitions >= 3;
}

export type CardStatus = "new" | "learning" | "review" | "mastered";

export function getCardStatus(card: SM2Card & { dueDate: Date }): CardStatus {
  if (card.repetitions === 0) return "new";
  if (isMastered(card)) return "mastered";
  if (isDue(card.dueDate)) return "review";
  return "learning";
}
