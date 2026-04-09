import { prisma } from "@/lib/db";
import { parsePendingRatings } from "@/lib/review/pending-ratings";

type SessionLike = {
  id: string;
  cardIds: string[];
  currentIndex: number;
  pendingRatings: unknown;
  status: string;
};

/**
 * Marks abandoned/completed when the row is not actually resumable.
 * Returns null if the session was closed or input was null.
 */
export async function finalizeStaleReviewSession<S extends SessionLike>(
  row: S | null
): Promise<S | null> {
  if (!row || row.status !== "active") return null;

  const n = row.cardIds.length;
  const pending = parsePendingRatings(row.pendingRatings);

  if (n === 0) {
    await prisma.reviewSession.update({
      where: { id: row.id },
      data: { status: "abandoned" },
    });
    return null;
  }

  const pastEnd = row.currentIndex >= n;
  if (pastEnd && pending.length === 0) {
    await prisma.reviewSession.update({
      where: { id: row.id },
      data: { status: "completed" },
    });
    return null;
  }

  return row;
}
