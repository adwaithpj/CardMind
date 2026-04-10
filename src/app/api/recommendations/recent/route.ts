import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recommendations = await prisma.videoRecommendation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        card: { select: { front: true } },
      },
    });

    const data = recommendations.map((r) => ({
      id: r.id,
      videoId: r.videoId,
      title: r.title,
      channelName: r.channelName,
      thumbnailUrl: r.thumbnailUrl,
      videoUrl: r.videoUrl,
      cardFront: r.card.front,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch recent recommendations" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.videoRecommendation.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ data: { success: true } });
}
