"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  Target,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { REVIEW_ACTIVITY_CHANGED } from "@/lib/review/activity-events";

type ReadinessResult = {
  daysRemaining: number;
  readinessPercent: number;
  dailyGoal: number;
  dueToday: number;
  status: "on_track" | "behind" | "completed" | "overdue";
  message: string;
};

type ExamData = {
  id: string;
  title: string;
  examDate: string;
  deckId: string | null;
  dailyGoal: number;
  readiness: ReadinessResult;
  deck?: { id: string; title: string; emoji: string | null } | null;
  examDecks?: { deckId: string; deck?: { id: string; title: string; emoji: string | null } }[];
};

const statusConfig = {
  on_track: {
    barColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
    borderAccent: "border-emerald-500/20",
    gradientFrom: "from-emerald-500/5",
  },
  behind: {
    barColor: "bg-amber-500",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/15",
    badgeText: "text-amber-700 dark:text-amber-400",
    icon: AlertTriangle,
    borderAccent: "border-amber-500/20",
    gradientFrom: "from-amber-500/5",
  },
  overdue: {
    barColor: "bg-red-500",
    badgeBg: "bg-red-500/10 dark:bg-red-500/15",
    badgeText: "text-red-700 dark:text-red-400",
    icon: AlertTriangle,
    borderAccent: "border-red-500/20",
    gradientFrom: "from-red-500/5",
  },
  completed: {
    barColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
    borderAccent: "border-emerald-500/20",
    gradientFrom: "from-emerald-500/5",
  },
} as const;

export function ExamCountdownCard() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    fetch("/api/exams")
      .then((r) => r.json())
      .then((json: { data?: ExamData[] }) => {
        if (json.data) setExams(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchExams(false);
    const onActivity = () => fetchExams(true);
    window.addEventListener(REVIEW_ACTIVITY_CHANGED, onActivity);
    return () => window.removeEventListener(REVIEW_ACTIVITY_CHANGED, onActivity);
  }, [fetchExams]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 animate-pulse min-h-[10rem]" />
    );
  }

  const activeExams = exams.filter(
    (e) => e.readiness.daysRemaining > 0 && e.readiness.status !== "completed"
  );

  if (activeExams.length === 0) return null;

  const nearest = activeExams[0];
  const config = statusConfig[nearest.readiness.status];
  const StatusIcon = config.icon;

  const reviewHref = `/review/exam/${nearest.id}?fresh=1&mode=recall`;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br to-transparent p-5 shadow-sm sm:p-6",
        "border-border bg-card",
        config.borderAccent,
        config.gradientFrom,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Exam countdown
            </p>
            <p className="font-semibold text-foreground truncate">
              {nearest.title}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-end gap-6">
        <div className="text-center">
          <span className="text-5xl font-extrabold tabular-nums text-foreground leading-none">
            {nearest.readiness.daysRemaining}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            day{nearest.readiness.daysRemaining !== 1 ? "s" : ""} left
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Readiness</span>
            <span className="font-semibold text-foreground tabular-nums">
              {nearest.readiness.readinessPercent}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                config.barColor,
              )}
              style={{
                width: `${Math.min(100, nearest.readiness.readinessPercent)}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                config.badgeBg,
                config.badgeText,
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden />
              {nearest.readiness.status === "on_track"
                ? "On track"
                : nearest.readiness.status === "behind"
                  ? "Behind"
                  : nearest.readiness.status === "overdue"
                    ? "Overdue"
                    : "Ready"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5">
        <Target className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-foreground flex-1">
          <span className="font-semibold">
            {nearest.readiness.dailyGoal} cards/day
          </span>
          {nearest.readiness.dueToday > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-medium ml-1.5">
              ({nearest.readiness.dueToday} due now)
            </span>
          )}
          <span className="block text-xs text-muted-foreground mt-0.5">
            {nearest.readiness.message}
          </span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={reviewHref}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Start today&apos;s session
        </Link>
        {activeExams.length > 1 && (
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            All exams
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {(nearest.examDecks && nearest.examDecks.length > 0) || nearest.deck ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {nearest.examDecks && nearest.examDecks.length > 0 ? (
            <>
              Linked decks:{" "}
              {nearest.examDecks.map((row, i) => (
                <span key={row.deckId}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/decks/${row.deckId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.deck?.emoji ?? "📚"} {row.deck?.title ?? "Deck"}
                  </Link>
                </span>
              ))}
            </>
          ) : nearest.deck ? (
            <>
              Linked to{" "}
              <Link
                href={`/decks/${nearest.deck.id}`}
                className="font-medium text-primary hover:underline"
              >
                {nearest.deck.emoji ?? "📚"} {nearest.deck.title}
              </Link>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          All decks — session mixes cards from your library.
        </p>
      )}
    </div>
  );
}
