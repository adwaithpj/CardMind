import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parsePendingRatings,
  type PendingRating,
} from "@/lib/review/pending-ratings";
import { finalizeStaleReviewSession } from "@/lib/review/finalize-stale-session";
import { getExamLinkedDeckIds } from "@/lib/exams/exam-decks";

const MAX_NEW_PER_SESSION = 15;
const MAX_DUE_PER_SESSION = 30;
const MAX_CRAM_CARDS = 100;

export type { PendingRating };

async function buildRecallSessionCards(deckId: string) {
  const sessionCards = await prisma.card.findMany({
    where: { deckId },
    orderBy: { createdAt: "asc" },
  });

  for (let i = sessionCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
  }

  return {
    sessionCards,
    stats: {
      due: sessionCards.length,
      new: 0,
      total: sessionCards.length,
      mode: "recall" as const,
    },
  };
}

async function buildRecallSessionCardsForDeckIds(deckIds: string[]) {
  const sessionCards = await prisma.card.findMany({
    where: { deckId: { in: deckIds } },
    orderBy: { createdAt: "asc" },
  });

  for (let i = sessionCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
  }

  return {
    sessionCards,
    stats: {
      due: sessionCards.length,
      new: 0,
      total: sessionCards.length,
      mode: "recall" as const,
    },
  };
}

async function buildShuffledSessionCards(deckId: string) {
  const now = new Date();

  const dueCards = await prisma.card.findMany({
    where: { deckId, dueDate: { lte: now } },
    orderBy: { dueDate: "asc" },
    take: MAX_DUE_PER_SESSION,
  });

  const newCardsResult = await prisma.card.findMany({
    where: { deckId, repetitions: 0 },
    take: MAX_NEW_PER_SESSION,
  });

  const dueIds = new Set(dueCards.map((c) => c.id));
  const sessionCards = [
    ...dueCards,
    ...newCardsResult.filter((c) => !dueIds.has(c.id)),
  ];

  for (let i = sessionCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
  }

  return {
    sessionCards,
    stats: {
      due: dueCards.length,
      new: newCardsResult.length,
      total: sessionCards.length,
      mode: "normal" as const,
    },
  };
}

async function buildCramSessionCards(deckId: string) {
  const sessionCards = await prisma.card.findMany({
    where: { deckId },
    take: MAX_CRAM_CARDS,
  });

  for (let i = sessionCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
  }

  return {
    sessionCards,
    stats: {
      due: sessionCards.length,
      new: 0,
      total: sessionCards.length,
      mode: "cram" as const,
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const deckId = searchParams.get("deckId");
  const fresh = searchParams.get("fresh") === "1";
  const isCram = searchParams.get("mode") === "cram";
  const isRecall = searchParams.get("mode") === "recall";

  if (examId && isRecall) {
    return examRecallHandler(userId, examId, fresh);
  }

  if (!deckId) {
    return NextResponse.json({ error: "deckId required" }, { status: 400 });
  }

  try {
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId },
    });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (fresh || isCram || isRecall) {
      await prisma.reviewSession.updateMany({
        where: { userId, deckId, status: "active", examCountdownId: null },
        data: { status: "abandoned" },
      });
    }

    const existingRaw =
      fresh || isCram || isRecall
        ? null
        : await prisma.reviewSession.findFirst({
            where: {
              userId,
              deckId,
              status: "active",
              examCountdownId: null,
            },
            orderBy: { lastActivityAt: "desc" },
          });

    const existing = await finalizeStaleReviewSession(existingRaw);

    if (existing) {
      const cards = await prisma.card.findMany({
        where: { id: { in: existing.cardIds }, deckId },
      });
      const orderMap = new Map(existing.cardIds.map((id, i) => [id, i]));
      cards.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

      const pendingRatings = parsePendingRatings(existing.pendingRatings);

      return NextResponse.json({
        data: {
          sessionId: existing.id,
          cards,
          stats: {
            due: 0,
            new: 0,
            total: cards.length,
            mode: "normal" as const,
          },
          currentIndex: existing.currentIndex,
          pendingRatings,
          resumed: true,
        },
      });
    }

    if (isRecall) {
      const { sessionCards, stats } = await buildRecallSessionCards(deckId);
      if (sessionCards.length === 0) {
        return NextResponse.json({
          data: {
            sessionId: null,
            cards: [],
            stats: { due: 0, new: 0, total: 0, mode: "recall" as const },
            currentIndex: 0,
            pendingRatings: [] as PendingRating[],
            resumed: false,
          },
        });
      }
      const row = await prisma.reviewSession.create({
        data: {
          userId,
          deckId,
          cardIds: sessionCards.map((c) => c.id),
          currentIndex: 0,
          pendingRatings: [],
          status: "active",
        },
      });
      return NextResponse.json({
        data: {
          sessionId: row.id,
          cards: sessionCards,
          stats,
          currentIndex: 0,
          pendingRatings: [] as PendingRating[],
          resumed: false,
        },
      });
    }

    if (isCram) {
      const { sessionCards, stats } = await buildCramSessionCards(deckId);
      if (sessionCards.length === 0) {
        return NextResponse.json({
          data: {
            sessionId: null,
            cards: [],
            stats: { due: 0, new: 0, total: 0, mode: "cram" as const },
            currentIndex: 0,
            pendingRatings: [] as PendingRating[],
            resumed: false,
          },
        });
      }
      const row = await prisma.reviewSession.create({
        data: {
          userId,
          deckId,
          cardIds: sessionCards.map((c) => c.id),
          currentIndex: 0,
          pendingRatings: [],
          status: "active",
        },
      });
      return NextResponse.json({
        data: {
          sessionId: row.id,
          cards: sessionCards,
          stats,
          currentIndex: 0,
          pendingRatings: [] as PendingRating[],
          resumed: false,
        },
      });
    }

    const { sessionCards, stats } = await buildShuffledSessionCards(deckId);

    if (sessionCards.length === 0) {
      return NextResponse.json({
        data: {
          sessionId: null,
          cards: [],
          stats: { due: 0, new: 0, total: 0, mode: "normal" as const },
          currentIndex: 0,
          pendingRatings: [] as PendingRating[],
          resumed: false,
        },
      });
    }

    const row = await prisma.reviewSession.create({
      data: {
        userId,
        deckId,
        cardIds: sessionCards.map((c) => c.id),
        currentIndex: 0,
        pendingRatings: [],
        status: "active",
      },
    });

    return NextResponse.json({
      data: {
        sessionId: row.id,
        cards: sessionCards,
        stats,
        currentIndex: 0,
        pendingRatings: [] as PendingRating[],
        resumed: false,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

async function examRecallHandler(userId: string, examId: string, fresh: boolean) {
  try {
    const exam = await prisma.examCountdown.findFirst({
      where: { id: examId, userId },
      include: { examDecks: true },
    });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const linked = getExamLinkedDeckIds(exam);
    const targetDeckIds =
      linked.length > 0
        ? linked
        : (
            await prisma.deck.findMany({
              where: { userId },
              select: { id: true },
            })
          ).map((d) => d.id);

    if (targetDeckIds.length === 0) {
      return NextResponse.json({
        data: {
          sessionId: null,
          cards: [],
          stats: { due: 0, new: 0, total: 0, mode: "recall" as const },
          currentIndex: 0,
          pendingRatings: [] as PendingRating[],
          resumed: false,
        },
      });
    }

    if (fresh) {
      await prisma.reviewSession.updateMany({
        where: { userId, examCountdownId: examId, status: "active" },
        data: { status: "abandoned" },
      });
    }

    const existingRaw = fresh
      ? null
      : await prisma.reviewSession.findFirst({
          where: { userId, examCountdownId: examId, status: "active" },
          orderBy: { lastActivityAt: "desc" },
        });

    const existing = await finalizeStaleReviewSession(existingRaw);

    if (existing) {
      const cards = await prisma.card.findMany({
        where: { id: { in: existing.cardIds } },
      });
      const orderMap = new Map(existing.cardIds.map((id, i) => [id, i]));
      cards.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

      const pendingRatings = parsePendingRatings(existing.pendingRatings);

      return NextResponse.json({
        data: {
          sessionId: existing.id,
          cards,
          stats: {
            due: 0,
            new: 0,
            total: cards.length,
            mode: "recall" as const,
          },
          currentIndex: existing.currentIndex,
          pendingRatings,
          resumed: true,
        },
      });
    }

    const anchorDeckId = targetDeckIds[0];
    const { sessionCards, stats } =
      await buildRecallSessionCardsForDeckIds(targetDeckIds);

    if (sessionCards.length === 0) {
      return NextResponse.json({
        data: {
          sessionId: null,
          cards: [],
          stats: { due: 0, new: 0, total: 0, mode: "recall" as const },
          currentIndex: 0,
          pendingRatings: [] as PendingRating[],
          resumed: false,
        },
      });
    }

    const row = await prisma.reviewSession.create({
      data: {
        userId,
        deckId: anchorDeckId,
        examCountdownId: examId,
        cardIds: sessionCards.map((c) => c.id),
        currentIndex: 0,
        pendingRatings: [],
        status: "active",
      },
    });

    return NextResponse.json({
      data: {
        sessionId: row.id,
        cards: sessionCards,
        stats,
        currentIndex: 0,
        pendingRatings: [] as PendingRating[],
        resumed: false,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
