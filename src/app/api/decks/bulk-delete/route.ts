import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const MAX_DECKS_PER_REQUEST = 50;

const schema = z.object({
  deckIds: z
    .array(z.string().uuid())
    .min(1, "At least one deck id is required")
    .max(MAX_DECKS_PER_REQUEST, `You can delete at most ${MAX_DECKS_PER_REQUEST} decks at once`),
});

/**
 * POST /api/decks/bulk-delete
 * Body: { deckIds: string[] } — only decks owned by the session user are removed.
 * Cards, review sessions, and review logs cascade via Prisma / DB constraints.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { deckIds } = schema.parse(body);

    const uniqueIds = [...new Set(deckIds)];

    const result = await prisma.$transaction(async (tx) => {
      const owned = await tx.deck.findMany({
        where: { userId, id: { in: uniqueIds } },
        select: { id: true },
      });
      const ids = owned.map((d) => d.id);
      if (ids.length === 0) {
        return { deletedCount: 0, deletedIds: [] as string[] };
      }
      await tx.deck.deleteMany({ where: { id: { in: ids } } });
      return { deletedCount: ids.length, deletedIds: ids };
    });

    return NextResponse.json({
      data: {
        deletedCount: result.deletedCount,
        deletedIds: result.deletedIds,
        requestedCount: uniqueIds.length,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to delete decks" }, { status: 500 });
  }
}
