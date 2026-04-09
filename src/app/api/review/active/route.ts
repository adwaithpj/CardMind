import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePendingRatings } from "@/lib/review/pending-ratings";
import { finalizeStaleReviewSession } from "@/lib/review/finalize-stale-session";
import { sortDecksByLastOpened } from "@/lib/decks/sort-by-last-opened";

/** Dashboard: resumable review + last opened deck (excluding deck already on resume card). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const rawActive = await prisma.reviewSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { lastActivityAt: "desc" },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            emoji: true,
            lastStudiedAt: true,
          },
        },
      },
    });

    const activeSession = await finalizeStaleReviewSession(rawActive);

    const decks = await prisma.deck.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        emoji: true,
        lastStudiedAt: true,
        lastOpenedAt: true,
        updatedAt: true,
        totalCards: true,
        dueCards: true,
      },
    });

    decks.sort(sortDecksByLastOpened);

    const resumeDeckId = activeSession?.deckId;
    const recentDeck =
      decks.find((d) => d.id !== resumeDeckId) ??
      (resumeDeckId ? null : decks[0] ?? null);

    if (!activeSession) {
      return NextResponse.json({
        data: {
          activeSession: null,
          recentDeck: recentDeck
            ? {
                id: recentDeck.id,
                title: recentDeck.title,
                emoji: recentDeck.emoji,
                lastStudiedAt: recentDeck.lastStudiedAt,
                lastOpenedAt: recentDeck.lastOpenedAt,
                totalCards: recentDeck.totalCards,
                dueCards: recentDeck.dueCards,
              }
            : null,
        },
      });
    }

    const pending = parsePendingRatings(activeSession.pendingRatings);
    const n = activeSession.cardIds.length;
    const needsSubmit =
      pending.length > 0 && (activeSession.currentIndex >= n || pending.length === n);

    return NextResponse.json({
      data: {
        activeSession: {
          id: activeSession.id,
          deckId: activeSession.deckId,
          deckTitle: activeSession.deck.title,
          deckEmoji: activeSession.deck.emoji ?? "📚",
          cardsTotal: activeSession.cardIds.length,
          currentIndex: activeSession.currentIndex,
          lastActivityAt: activeSession.lastActivityAt.toISOString(),
          pendingInQueue: pending.length,
          needsSubmit,
        },
        recentDeck: recentDeck
          ? {
              id: recentDeck.id,
              title: recentDeck.title,
              emoji: recentDeck.emoji,
              lastStudiedAt: recentDeck.lastStudiedAt,
              lastOpenedAt: recentDeck.lastOpenedAt,
              totalCards: recentDeck.totalCards,
              dueCards: recentDeck.dueCards,
            }
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
