import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeMasteryProgressPercent,
  countMasteredCards,
} from "@/lib/srs/mastery";

async function getOwnedDeck(deckId: string, userId: string) {
  return prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deck = await getOwnedDeck(id, session.user.id);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deckCards = await prisma.card.findMany({
    where: { deckId: id },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const stats = {
    total: deckCards.length,
    due: deckCards.filter((c) => c.dueDate <= now && c.repetitions > 0).length,
    newCards: deckCards.filter((c) => c.repetitions === 0).length,
    mastered: countMasteredCards(deckCards),
    masteryProgressPercent: computeMasteryProgressPercent(deckCards),
  };

  return NextResponse.json({ data: { deck, cards: deckCards, stats } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deck = await getOwnedDeck(id, session.user.id);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, emoji } = await req.json();
  const updated = await prisma.deck.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(emoji && { emoji }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deck = await getOwnedDeck(id, session.user.id);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deck.delete({ where: { id } });
  return NextResponse.json({ data: { success: true } });
}
