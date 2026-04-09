import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { isMastered } from "./sm2";

export function countMasteredCards<T extends { repetitions: number }>(
  cards: T[]
): number {
  return cards.filter((c) => isMastered(c)).length;
}

/** Ring progress: each card contributes 0–3 steps toward full mastery (3 successful reviews). */
export function computeMasteryProgressPercent(
  cards: { repetitions: number }[]
): number {
  if (cards.length === 0) return 0;
  const steps = cards.reduce(
    (s, c) => s + Math.min(Math.max(c.repetitions, 0), 3),
    0
  );
  return Math.min(100, Math.round((100 * steps) / (3 * cards.length)));
}

export type DeckWithMasteryProgress<T extends { id: string } = { id: string }> =
  T & { masteryProgressPercent: number };

/** Batch-compute progress rings for dashboard / deck list (one SQL round-trip). */
export async function enrichDecksWithMasteryProgress<
  T extends { id: string },
>(decks: T[]): Promise<DeckWithMasteryProgress<T>[]> {
  if (decks.length === 0) return [];
  const ids = decks.map((d) => d.id);
  const rows = await prisma.$queryRaw<
    Array<{ deck_id: string; step_sum: number; card_count: number }>
  >`
    SELECT c.deck_id,
      COALESCE(SUM(LEAST(c.repetitions, 3)), 0)::int AS step_sum,
      COUNT(*)::int AS card_count
    FROM cards c
    WHERE c.deck_id IN (${Prisma.join(ids)})
    GROUP BY c.deck_id
  `;
  const rowMap = Object.fromEntries(rows.map((r) => [r.deck_id, r]));
  return decks.map((d) => {
    const row = rowMap[d.id];
    const cardCount = row?.card_count ?? 0;
    const stepSum = row?.step_sum ?? 0;
    const masteryProgressPercent =
      cardCount === 0
        ? 0
        : Math.min(100, Math.round((100 * stepSum) / (3 * cardCount)));
    return { ...d, masteryProgressPercent };
  });
}
