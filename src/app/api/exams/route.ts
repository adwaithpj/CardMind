import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { computeReadiness } from "@/lib/exams/readiness";
import {
  getLiveDeckStudyStats,
  getLiveStatsForDeckIds,
  getLiveUserStudyStats,
} from "@/lib/exams/live-card-stats";
import { getExamLinkedDeckIds } from "@/lib/exams/exam-decks";

const createSchema = z
  .object({
    title: z.string().min(1).max(255),
    examDate: z.coerce
      .date()
      .refine((d) => d > new Date(), "Exam date must be in the future"),
    deckId: z.string().uuid().optional(),
    deckIds: z.array(z.string().uuid()).max(40).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    let deckIds =
      parsed.deckIds && parsed.deckIds.length > 0
        ? [...new Set(parsed.deckIds)]
        : parsed.deckId
          ? [parsed.deckId]
          : [];

    if (deckIds.length > 0) {
      const owned = await prisma.deck.count({
        where: { userId: session.user.id, id: { in: deckIds } },
      });
      if (owned !== deckIds.length) {
        return NextResponse.json(
          { error: "One or more decks were not found" },
          { status: 400 },
        );
      }
    }

    const exam = await prisma.examCountdown.create({
      data: {
        userId: session.user.id,
        title: parsed.title,
        examDate: parsed.examDate,
        deckId: deckIds[0] ?? null,
        examDecks:
          deckIds.length > 0
            ? { create: deckIds.map((deckId) => ({ deckId })) }
            : undefined,
      },
      include: {
        examDecks: { include: { deck: true } },
        deck: true,
      },
    });

    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    throw err;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exams = await prisma.examCountdown.findMany({
    where: { userId: session.user.id },
    orderBy: { examDate: "asc" },
    include: {
      deck: true,
      examDecks: { include: { deck: true } },
    },
  });

  const results = await Promise.all(
    exams.map(async (exam) => {
      const linked = getExamLinkedDeckIds(exam);
      const { totalCards, masteredCards, dueCards } =
        linked.length === 0
          ? await getLiveUserStudyStats(session.user.id)
          : linked.length === 1
            ? await getLiveDeckStudyStats(linked[0])
            : await getLiveStatsForDeckIds(linked);

      const readiness = computeReadiness({
        totalCards,
        masteredCards,
        dueCards,
        examDate: exam.examDate,
      });
      return { ...exam, readiness };
    }),
  );

  return NextResponse.json({ data: results });
}
