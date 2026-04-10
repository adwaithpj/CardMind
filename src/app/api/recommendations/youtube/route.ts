import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchYouTube } from "@/lib/youtube/search";
import { z } from "zod";

const schema = z.object({
  cardIds: z
    .array(z.string().uuid())
    .min(1, "At least one card is required")
    .max(10, "Maximum 10 cards per request"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cardIds } = schema.parse(body);

    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, front: true, back: true, deckId: true },
    });

    if (cards.length === 0) {
      return NextResponse.json({ error: "No cards found" }, { status: 404 });
    }

    const recommendations: Array<{
      cardId: string;
      deckId: string;
      videos: Array<{
        videoId: string;
        title: string;
        channelName: string;
        thumbnailUrl: string;
        videoUrl: string;
      }>;
    }> = [];

    for (const card of cards) {
      const queryText = `${card.front} ${card.back}`.slice(0, 120).trim();
      const videos = await searchYouTube(queryText, 3);

      if (videos.length > 0) {
        await prisma.videoRecommendation.createMany({
          data: videos.map((v) => ({
            userId: session.user.id,
            cardId: card.id,
            deckId: card.deckId,
            videoId: v.videoId,
            title: v.title,
            channelName: v.channelName,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
          })),
        });

        recommendations.push({
          cardId: card.id,
          deckId: card.deckId,
          videos,
        });
      }
    }

    return NextResponse.json({ data: { recommendations } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch video recommendations" },
      { status: 500 },
    );
  }
}
