import { prisma } from "@/lib/db";

/** Call when the user opens a deck (detail or review page). */
export async function touchDeckLastOpened(deckId: string, userId: string): Promise<void> {
  await prisma.deck.updateMany({
    where: { id: deckId, userId },
    data: { lastOpenedAt: new Date() },
  });
}
