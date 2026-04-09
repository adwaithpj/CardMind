import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enrichDecksWithMasteryProgress } from "@/lib/srs/mastery";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  try {
    const now = new Date();

    const userDecks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    const dueCounts = await prisma.card.groupBy({
      by: ["deckId"],
      where: {
        dueDate: { lte: now },
        repetitions: { gt: 0 },
      },
      _count: { id: true },
    });

    const dueMap = Object.fromEntries(
      dueCounts.map((d) => [d.deckId, d._count.id])
    );

    const enriched = userDecks
      .map((d) => ({ ...d, dueCards: dueMap[d.id] ?? 0 }))
      .filter((d) => !q || d.title.toLowerCase().includes(q));

    const withProgress = await enrichDecksWithMasteryProgress(enriched);

    return NextResponse.json({ data: withProgress });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}
