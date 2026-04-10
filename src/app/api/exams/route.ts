import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { computeReadiness } from "@/lib/exams/readiness";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  examDate: z.coerce.date().refine((d) => d > new Date(), "Exam date must be in the future"),
  deckId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const exam = await prisma.examCountdown.create({
      data: {
        userId: session.user.id,
        title: parsed.title,
        examDate: parsed.examDate,
        deckId: parsed.deckId ?? null,
      },
    });

    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    throw err;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exams = await prisma.examCountdown.findMany({
    where: { userId: session.user.id },
    orderBy: { examDate: "asc" },
    include: { deck: true },
  });

  const results = await Promise.all(
    exams.map(async (exam) => {
      let totalCards = 0;
      let masteredCards = 0;
      let dueCards = 0;

      if (exam.deckId) {
        const deck = await prisma.deck.findUnique({ where: { id: exam.deckId } });
        if (deck) {
          totalCards = deck.totalCards;
          masteredCards = deck.masteredCards;
          dueCards = deck.dueCards;
        }
      } else {
        const agg = await prisma.deck.aggregate({
          where: { userId: session.user.id },
          _sum: { totalCards: true, masteredCards: true, dueCards: true },
        });
        totalCards = agg._sum.totalCards ?? 0;
        masteredCards = agg._sum.masteredCards ?? 0;
        dueCards = agg._sum.dueCards ?? 0;
      }

      const readiness = computeReadiness({ totalCards, masteredCards, dueCards, examDate: exam.examDate });
      return { ...exam, readiness };
    })
  );

  return NextResponse.json({ data: results });
}
