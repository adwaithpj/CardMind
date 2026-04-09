import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateSM2 } from "@/lib/srs/sm2";
import { countMasteredCards } from "@/lib/srs/mastery";
import { z } from "zod";

const schema = z.object({
  cardId: z.string().uuid(),
  rating: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cardId, rating } = schema.parse(body);

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const sm2Result = calculateSM2(
      {
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
      },
      rating
    );

    await prisma.card.update({
      where: { id: cardId },
      data: {
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        dueDate: sm2Result.dueDate,
        lastReviewed: new Date(),
      },
    });

    await prisma.reviewLog.create({
      data: {
        cardId,
        userId: session.user.id,
        rating,
        easeBefore: card.easeFactor,
        intervalBefore: card.interval,
      },
    });

    updateDeckStats(card.deckId).catch(console.error);

    return NextResponse.json({ data: { sm2: sm2Result } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
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
