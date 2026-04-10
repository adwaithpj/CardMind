import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchYouTube } from "@/lib/youtube/search";
import { z } from "zod";

const schema = z.object({
  query: z.string().max(500).optional().default(""),
  deckId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, deckId } = schema.parse(body);

    let searchQuery = query;
    let resolvedDeckId: string | null = null;

    if (deckId) {
      const deck = await prisma.deck.findFirst({
        where: { id: deckId, userId: session.user.id },
        select: { id: true, title: true },
      });

      if (!deck) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      }

      resolvedDeckId = deck.id;

      if (!searchQuery) {
        searchQuery = deck.title;
      } else {
        searchQuery = `${searchQuery} ${deck.title}`;
      }

      searchQuery += " study tutorial explanation";
    }

    if (!searchQuery.trim()) {
      return NextResponse.json({ error: "Provide a search query or select a deck" }, { status: 400 });
    }

    const videos = await searchYouTube(searchQuery.slice(0, 200), 9);

    if (videos.length > 0) {
      let cardId: string | null = null;
      let saveDeckId = resolvedDeckId;

      if (saveDeckId) {
        const firstCard = await prisma.card.findFirst({
          where: { deckId: saveDeckId },
          select: { id: true },
        });
        cardId = firstCard?.id ?? null;
      }

      if (!saveDeckId) {
        const firstDeck = await prisma.deck.findFirst({
          where: { userId: session.user.id },
          select: { id: true },
          orderBy: { updatedAt: "desc" },
        });
        if (firstDeck) {
          saveDeckId = firstDeck.id;
          const firstCard = await prisma.card.findFirst({
            where: { deckId: saveDeckId },
            select: { id: true },
          });
          cardId = firstCard?.id ?? null;
        }
      }

      if (saveDeckId && cardId) {
        await prisma.videoRecommendation.createMany({
          data: videos.map((v) => ({
            userId: session.user.id,
            cardId: cardId!,
            deckId: saveDeckId!,
            videoId: v.videoId,
            title: v.title,
            channelName: v.channelName,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
          })),
        });
      }
    }

    return NextResponse.json({ data: { videos } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("Video search error:", err);
    return NextResponse.json({ error: "Failed to search videos" }, { status: 500 });
  }
}
