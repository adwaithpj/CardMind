import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  rankDecksForToday,
  type DeckInput,
  type ExamInput,
} from "@/lib/study-plan/rank-decks";
import { getExamLinkedDeckIds } from "@/lib/exams/exam-decks";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const twoDaysAgo = new Date(startOfDay);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const decks = await prisma.deck.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        emoji: true,
        totalCards: true,
      },
    });

    if (decks.length === 0) {
      return NextResponse.json({
        data: { plan: [], dailyGoal: 20, reviewed: 0, remaining: 0 },
      });
    }

    const deckIds = decks.map((d) => d.id);

    const dueAgg = await prisma.card.groupBy({
      by: ["deckId"],
      where: { deckId: { in: deckIds }, dueDate: { lte: endOfDay } },
      _count: { id: true },
    });

    const overdueAgg = await prisma.card.groupBy({
      by: ["deckId"],
      where: { deckId: { in: deckIds }, dueDate: { lte: twoDaysAgo } },
      _count: { id: true },
    });

    const newAgg = await prisma.card.groupBy({
      by: ["deckId"],
      where: { deckId: { in: deckIds }, repetitions: 0 },
      _count: { id: true },
    });

    const easeAgg = await prisma.card.groupBy({
      by: ["deckId"],
      where: { deckId: { in: deckIds } },
      _avg: { easeFactor: true },
    });

    const dueMap = new Map(dueAgg.map((r) => [r.deckId, r._count.id]));
    const overdueMap = new Map(overdueAgg.map((r) => [r.deckId, r._count.id]));
    const newMap = new Map(newAgg.map((r) => [r.deckId, r._count.id]));
    const easeMap = new Map(easeAgg.map((r) => [r.deckId, r._avg.easeFactor ?? 2.5]));

    const deckInputs: DeckInput[] = decks.map((d) => ({
      id: d.id,
      title: d.title,
      emoji: d.emoji,
      totalCards: d.totalCards,
      dueCount: dueMap.get(d.id) ?? 0,
      overdueCount: overdueMap.get(d.id) ?? 0,
      newCount: newMap.get(d.id) ?? 0,
      avgEase: easeMap.get(d.id) ?? 2.5,
    }));

    const exams = await prisma.examCountdown.findMany({
      where: { userId, examDate: { gte: now } },
      select: { deckId: true, examDate: true, title: true, examDecks: { select: { deckId: true } } },
    });
    const examInputs: ExamInput[] = exams.map((e) => ({
      linkedDeckIds: getExamLinkedDeckIds(e),
      examDate: e.examDate,
      title: e.title,
    }));

    const goal = await prisma.studyGoal.findUnique({ where: { userId } });
    const dailyGoal = goal?.dailyCardTarget ?? 20;

    const reviewed = await prisma.reviewLog.count({
      where: { userId, reviewedAt: { gte: startOfDay } },
    });

    const plan = rankDecksForToday(deckInputs, examInputs, dailyGoal, reviewed);
    const remaining = Math.max(dailyGoal - reviewed, 0);

    return NextResponse.json({
      data: { plan, dailyGoal, reviewed, remaining },
    });
  } catch (err) {
    console.error("study-plan error:", err);
    return NextResponse.json(
      { error: "Failed to compute study plan" },
      { status: 500 },
    );
  }
}
