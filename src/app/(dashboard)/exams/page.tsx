import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeReadiness } from "@/lib/exams/readiness";
import type { ReadinessResult } from "@/lib/exams/readiness";
import {
  getLiveDeckStudyStats,
  getLiveStatsForDeckIds,
  getLiveUserStudyStats,
} from "@/lib/exams/live-card-stats";
import { getExamLinkedDeckIds } from "@/lib/exams/exam-decks";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Target, BookOpen } from "lucide-react";
import { ExamSetupDialogWithRefresh } from "./ExamSetupDialogWithRefresh";
import { ExamDeleteButton } from "./ExamDeleteButton";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [rawExams, userDecks] = await Promise.all([
    prisma.examCountdown.findMany({
      where: { userId },
      orderBy: { examDate: "asc" },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            emoji: true,
            totalCards: true,
            masteredCards: true,
            dueCards: true,
          },
        },
        examDecks: {
          include: {
            deck: { select: { id: true, title: true, emoji: true } },
          },
        },
      },
    }),
    prisma.deck.findMany({
      where: { userId },
      select: { id: true, title: true, emoji: true, totalCards: true, masteredCards: true, dueCards: true },
    }),
  ]);

  const exams = await Promise.all(
    rawExams.map(async (exam) => {
      const linked = getExamLinkedDeckIds(exam);
      const { totalCards, masteredCards, dueCards } =
        linked.length === 0
          ? await getLiveUserStudyStats(userId)
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

  const deckOptions = userDecks.map((d) => ({ id: d.id, title: d.title, emoji: d.emoji }));

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Exam Countdowns
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your upcoming exams and stay on pace.
          </p>
        </div>
        <ExamSetupDialogWithRefresh decks={deckOptions} />
      </div>

      {exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No exams set up yet. Create your first countdown to start tracking.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

const statusMeta = {
  on_track: { label: "On track", barColor: "bg-emerald-500", dotColor: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-400" },
  behind: { label: "Behind", barColor: "bg-amber-500", dotColor: "bg-amber-500", textColor: "text-amber-700 dark:text-amber-400" },
  overdue: { label: "Overdue", barColor: "bg-red-500", dotColor: "bg-red-500", textColor: "text-red-700 dark:text-red-400" },
  completed: { label: "Ready", barColor: "bg-emerald-500", dotColor: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-400" },
} as const;

type ExamWithReadiness = {
  id: string;
  title: string;
  examDate: Date;
  deckId: string | null;
  dailyGoal: number;
  readiness: ReadinessResult;
  deck: { id: string; title: string; emoji: string | null } | null;
  examDecks: {
    deckId: string;
    deck: { id: string; title: string; emoji: string | null };
  }[];
};

function ExamCard({ exam }: { exam: ExamWithReadiness }) {
  const meta = statusMeta[exam.readiness.status];
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(exam.examDate));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">
            {exam.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {dateStr}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-3xl font-extrabold tabular-nums text-foreground leading-none">
            {exam.readiness.daysRemaining}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            day{exam.readiness.daysRemaining !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
            <span className={`text-xs font-medium ${meta.textColor}`}>
              {meta.label}
            </span>
          </div>
          <span className="font-semibold text-foreground tabular-nums text-xs">
            {exam.readiness.readinessPercent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
            style={{
              width: `${Math.min(100, exam.readiness.readinessPercent)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          <span className="font-semibold text-foreground">
            {exam.readiness.dailyGoal}
          </span>{" "}
          cards/day
        </span>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
        {exam.readiness.message}
      </p>

      {exam.examDecks.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <BookOpen className="h-3 w-3 shrink-0" />
            Linked decks
          </span>
          {": "}
          {exam.examDecks.map((row, i) => (
            <span key={row.deckId}>
              {i > 0 ? ", " : ""}
              <Link
                href={`/decks/${row.deckId}`}
                className="font-medium text-primary hover:underline"
              >
                {row.deck.emoji ?? "📚"} {row.deck.title}
              </Link>
            </span>
          ))}
        </p>
      ) : exam.deck ? (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 shrink-0" />
          <Link
            href={`/decks/${exam.deck.id}`}
            className="font-medium text-primary hover:underline truncate"
          >
            {exam.deck.emoji ?? "📚"} {exam.deck.title}
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          All decks — mixed session uses your full library.
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center gap-2 border-t border-border">
        <Link
          href={`/review/exam/${exam.id}?fresh=1&mode=recall`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition"
        >
          Study now
        </Link>
        <ExamDeleteButton examId={exam.id} examTitle={exam.title} />
      </div>
    </div>
  );
}
