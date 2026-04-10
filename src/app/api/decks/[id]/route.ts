import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeMasteryProgressPercent,
  countMasteredCards,
} from "@/lib/srs/mastery";
import { z } from "zod";

const patchDeckSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    emoji: z.string().min(1).max(10).optional(),
    lastOpenedAt: z.coerce.date().optional(),
  })
  .strict();

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

  try {
    const raw = await req.json();
    const parsed = patchDeckSchema.parse(raw);

    const data: {
      title?: string;
      description?: string | null;
      emoji?: string;
      lastOpenedAt?: Date;
    } = {};

    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.emoji !== undefined) data.emoji = parsed.emoji;
    if (parsed.lastOpenedAt !== undefined) data.lastOpenedAt = parsed.lastOpenedAt;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one of: title, description, emoji, lastOpenedAt" },
        { status: 400 }
      );
    }

    const updated = await prisma.deck.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    throw err;
  }
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
