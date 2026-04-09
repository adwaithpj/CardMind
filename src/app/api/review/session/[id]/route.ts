import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  currentIndex: z.number().int().min(0),
  pendingRatings: z.array(
    z.object({
      cardId: z.string().uuid(),
      rating: z.number().int().min(0).max(5),
    })
  ),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const { currentIndex, pendingRatings } = patchSchema.parse(body);

    const row = await prisma.reviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id, status: "active" },
    });

    if (!row) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const cardIdSet = new Set(row.cardIds);
    for (const p of pendingRatings) {
      if (!cardIdSet.has(p.cardId)) {
        return NextResponse.json({ error: "Invalid card in queue" }, { status: 400 });
      }
    }

    if (currentIndex > row.cardIds.length) {
      return NextResponse.json({ error: "Invalid currentIndex" }, { status: 400 });
    }

    await prisma.reviewSession.update({
      where: { id: sessionId },
      data: {
        currentIndex,
        pendingRatings,
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
