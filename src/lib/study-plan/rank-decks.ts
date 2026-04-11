export type DeckInput = {
  id: string;
  title: string;
  emoji: string | null;
  totalCards: number;
  dueCount: number;
  overdueCount: number;
  newCount: number;
  avgEase: number;
};

export type ExamInput = {
  /** Empty = exam tracks all decks; otherwise only these decks get the exam boost */
  linkedDeckIds: string[];
  examDate: Date;
  title: string;
};

export type RankedDeck = {
  deckId: string;
  title: string;
  emoji: string;
  dueCount: number;
  newCount: number;
  suggestedCards: number;
  reason: string;
  priority: number;
};

const WEIGHT_DUE_RATIO = 0.4;
const WEIGHT_OVERDUE = 0.25;
const WEIGHT_EXAM = 0.2;
const WEIGHT_LOW_EASE = 0.15;

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function scoreDeck(
  deck: DeckInput,
  exams: ExamInput[],
): { score: number; reason: string } {
  if (deck.totalCards === 0) return { score: 0, reason: "Empty deck" };

  const dueRatio = deck.totalCards > 0 ? deck.dueCount / deck.totalCards : 0;
  const dueScore = Math.min(dueRatio, 1) * 100;

  const overdueScore =
    deck.dueCount > 0
      ? Math.min(deck.overdueCount / deck.dueCount, 1) * 100
      : 0;

  let examScore = 0;
  let examDays = Infinity;
  for (const exam of exams) {
    const applies =
      exam.linkedDeckIds.length === 0 ||
      exam.linkedDeckIds.includes(deck.id);
    if (!applies) continue;
    const days = daysUntil(exam.examDate);
    if (days > 0 && days <= 14 && days < examDays) {
      examDays = days;
      examScore = Math.min(((14 - days) / 14) * 100, 100);
    }
  }

  const easeScore = deck.avgEase < 2.0 ? ((2.0 - deck.avgEase) / 0.7) * 100 : 0;

  const weighted =
    dueScore * WEIGHT_DUE_RATIO +
    overdueScore * WEIGHT_OVERDUE +
    examScore * WEIGHT_EXAM +
    Math.min(easeScore, 100) * WEIGHT_LOW_EASE;

  const priority = Math.round(Math.min(weighted, 100));

  let reason = "";
  if (examScore > 0 && examDays !== Infinity) {
    reason = `Exam in ${examDays}d`;
  } else if (deck.overdueCount > 0) {
    reason = `${deck.overdueCount} overdue`;
  } else if (deck.avgEase < 2.0) {
    reason = "Weak recall";
  } else if (deck.dueCount > 0) {
    reason = `${deck.dueCount} due`;
  } else if (deck.newCount > 0) {
    reason = `${deck.newCount} new`;
  } else {
    reason = "Up to date";
  }

  return { score: priority, reason };
}

export function rankDecksForToday(
  decks: DeckInput[],
  exams: ExamInput[],
  dailyTarget: number,
  alreadyReviewed: number,
): RankedDeck[] {
  const scored = decks
    .filter((d) => d.totalCards > 0)
    .map((d) => {
      const { score, reason } = scoreDeck(d, exams);
      return { deck: d, score, reason };
    })
    .filter((d) => d.deck.dueCount > 0 || d.deck.newCount > 0)
    .sort((a, b) => b.score - a.score);

  let remaining = Math.max(dailyTarget - alreadyReviewed, 0);
  const result: RankedDeck[] = [];

  for (const { deck, score, reason } of scored) {
    if (remaining <= 0) break;

    const available = deck.dueCount + deck.newCount;
    const suggested = Math.min(available, remaining);

    result.push({
      deckId: deck.id,
      title: deck.title,
      emoji: deck.emoji ?? "📚",
      dueCount: deck.dueCount,
      newCount: deck.newCount,
      suggestedCards: suggested,
      reason,
      priority: score,
    });

    remaining -= suggested;
  }

  return result;
}
