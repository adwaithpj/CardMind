import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReviewSession } from "@/components/review/ReviewSession";
import { getExamLinkedDeckIds } from "@/lib/exams/exam-decks";

export const dynamic = "force-dynamic";

export default async function ExamReviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const exam = await prisma.examCountdown.findFirst({
    where: { id: examId, userId },
    include: { examDecks: true },
  });

  if (!exam) notFound();

  const linked = getExamLinkedDeckIds(exam);
  const firstDeckId =
    linked[0] ??
    (
      await prisma.deck.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      })
    )?.id;

  if (!firstDeckId) notFound();

  const deck = await prisma.deck.findFirst({
    where: { id: firstDeckId, userId },
  });

  if (!deck) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground text-sm">
          Loading session…
        </div>
      }
    >
      <ReviewSession deck={deck} examId={examId} examTitle={exam.title} />
    </Suspense>
  );
}
