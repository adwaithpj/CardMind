import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateSM2 } from "@/lib/srs/sm2";
import { countMasteredCards } from "@/lib/srs/mastery";
import { z } from "zod";
import { parsePendingRatings } from "@/lib/review/pending-ratings";

const schema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { sessionId } = schema.parse(body);

    const row = await prisma.reviewSession.findFirst({
      where: { id: sessionId, userId, status: "active" },
    });

    if (!row) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const pending = parsePendingRatings(row.pendingRatings);
    if (pending.length === 0) {
      return NextResponse.json({ error: "Nothing to submit" }, { status: 400 });
    }

    const cardIdSet = new Set(row.cardIds);
    const deckId = row.deckId;
    const submittedRatings = [...pending];
    const n = row.cardIds.length;
    // Full queue saved in one batch (common) even if PATCH debounce left currentIndex stale
    const sessionComplete =
      row.currentIndex >= n || pending.length === n;

    await prisma.$transaction(async (tx) => {
      for (const { cardId, rating } of pending) {
        if (!cardIdSet.has(cardId)) {
          throw new Error("Invalid card in queue");
        }

        const card = await tx.card.findFirst({
          where: { id: cardId, deckId },
        });
        if (!card) {
          throw new Error("Card not found");
        }

        const sm2Result = calculateSM2(
          {
            easeFactor: card.easeFactor,
            interval: card.interval,
            repetitions: card.repetitions,
          },
          rating
        );

        await tx.card.update({
          where: { id: cardId },
          data: {
            easeFactor: sm2Result.easeFactor,
            interval: sm2Result.interval,
            repetitions: sm2Result.repetitions,
            dueDate: sm2Result.dueDate,
            lastReviewed: new Date(),
          },
        });

        await tx.reviewLog.create({
          data: {
            cardId,
            userId,
            rating,
            easeBefore: card.easeFactor,
            intervalBefore: card.interval,
          },
        });
      }

      await tx.reviewSession.update({
        where: { id: sessionId },
        data: {
          pendingRatings: [],
          status: sessionComplete ? "completed" : "active",
        },
      });
    });

    await updateDeckStats(deckId);

    revalidatePath("/");
    revalidatePath("/review");
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/review/${deckId}`);

    return NextResponse.json({
      data: {
        applied: submittedRatings.length,
        sessionComplete,
        submittedRatings,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to submit";
    if (message.includes("Invalid") || message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit batch" }, { status: 500 });
  }
}

async function updateDeckStats(deckId: string) {
  const now = new Date();
  const deckCards = await prisma.card.findMany({
    where: { deckId },
    select: { repetitions: true, easeFactor: true, dueDate: true },
  });

  const total = deckCards.length;
  const newCards = deckCards.filter((c) => c.repetitions === 0).length;
  const due = deckCards.filter((c) => c.dueDate <= now && c.repetitions > 0).length;
  const mastered = countMasteredCards(deckCards);

  await prisma.deck.update({
    where: { id: deckId },
    data: {
      totalCards: total,
      newCards,
      dueCards: due,
      masteredCards: mastered,
      lastStudiedAt: new Date(),
    },
  });
}
