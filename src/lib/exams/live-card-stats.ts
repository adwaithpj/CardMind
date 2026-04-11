import { prisma } from "@/lib/db";

/** Matches `updateDeckStats` in submit-batch: due = scheduled reviews (not brand-new cards). */
export async function getLiveDeckStudyStats(deckId: string) {
  const now = new Date();
  const [totalCards, masteredCards, dueCards] = await Promise.all([
    prisma.card.count({ where: { deckId } }),
    prisma.card.count({ where: { deckId, repetitions: { gte: 3 } } }),
    prisma.card.count({
      where: { deckId, dueDate: { lte: now }, repetitions: { gt: 0 } },
    }),
  ]);
  return { totalCards, masteredCards, dueCards };
}

export async function getLiveUserStudyStats(userId: string) {
  const now = new Date();
  const decks = await prisma.deck.findMany({
    where: { userId },
    select: { id: true },
  });
  const deckIds = decks.map((d) => d.id);
  if (deckIds.length === 0) {
    return { totalCards: 0, masteredCards: 0, dueCards: 0 };
  }
  const [totalCards, masteredCards, dueCards] = await Promise.all([
    prisma.card.count({ where: { deckId: { in: deckIds } } }),
    prisma.card.count({
      where: { deckId: { in: deckIds }, repetitions: { gte: 3 } },
    }),
    prisma.card.count({
      where: {
        deckId: { in: deckIds },
        dueDate: { lte: now },
        repetitions: { gt: 0 },
      },
    }),
  ]);
  return { totalCards, masteredCards, dueCards };
}

/** Aggregate stats across specific decks (e.g. exam linked to multiple decks). */
export async function getLiveStatsForDeckIds(deckIds: string[]) {
  if (deckIds.length === 0) {
    return { totalCards: 0, masteredCards: 0, dueCards: 0 };
  }
  const now = new Date();
  const [totalCards, masteredCards, dueCards] = await Promise.all([
    prisma.card.count({ where: { deckId: { in: deckIds } } }),
    prisma.card.count({
      where: { deckId: { in: deckIds }, repetitions: { gte: 3 } },
    }),
    prisma.card.count({
      where: {
        deckId: { in: deckIds },
        dueDate: { lte: now },
        repetitions: { gt: 0 },
      },
    }),
  ]);
  return { totalCards, masteredCards, dueCards };
}
