import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { VideoSearchClient } from "./VideoSearchClient";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, emoji: true },
    orderBy: { updatedAt: "desc" },
  });

  const recentVideos = await prisma.videoRecommendation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { card: { select: { front: true } }, deck: { select: { title: true, emoji: true } } },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Video Recommendations</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Search YouTube for study videos related to your decks and topics.
        </p>
      </div>
      <VideoSearchClient
        decks={decks.map((d) => ({ id: d.id, title: d.title, emoji: d.emoji ?? "📚" }))}
        initialVideos={recentVideos.map((v) => ({
          id: v.id,
          videoId: v.videoId,
          title: v.title,
          channelName: v.channelName,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          cardFront: v.card?.front ?? null,
          deckTitle: v.deck?.title ?? null,
          deckEmoji: v.deck?.emoji ?? "📚",
          createdAt: v.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
