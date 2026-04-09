export type PendingRating = { cardId: string; rating: number };

export function parsePendingRatings(value: unknown): PendingRating[] {
  if (!Array.isArray(value)) return [];
  const out: PendingRating[] = [];
  for (const row of value) {
    if (
      row &&
      typeof row === "object" &&
      "cardId" in row &&
      "rating" in row &&
      typeof (row as { cardId: unknown }).cardId === "string" &&
      typeof (row as { rating: unknown }).rating === "number"
    ) {
      out.push({
        cardId: (row as PendingRating).cardId,
        rating: (row as PendingRating).rating,
      });
    }
  }
  return out;
}
