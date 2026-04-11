"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Play,
  Settings,
  Sparkles,
  Trophy,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyGoalDialog } from "./StudyGoalDialog";

type RankedDeck = {
  deckId: string;
  title: string;
  emoji: string;
  dueCount: number;
  newCount: number;
  suggestedCards: number;
  reason: string;
  priority: number;
};

type StudyPlanData = {
  plan: RankedDeck[];
  dailyGoal: number;
  reviewed: number;
  remaining: number;
};

const REVIEW_ACTIVITY_EVENT = "cardmind:review-activity-changed";

function ProgressRing({
  reviewed,
  goal,
}: {
  reviewed: number;
  goal: number;
}) {
  const pct = goal > 0 ? Math.min((reviewed / goal) * 100, 100) : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const done = reviewed >= goal;

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={92} height={92} className="-rotate-90">
        <circle
          cx={46}
          cy={46}
          r={radius}
          fill="none"
          strokeWidth={6}
          className="stroke-muted"
        />
        <circle
          cx={46}
          cy={46}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-700",
            done ? "stroke-emerald-500" : "stroke-primary",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? (
          <Trophy className="h-5 w-5 text-emerald-500" />
        ) : (
          <span className="text-lg font-bold tabular-nums text-foreground">
            {reviewed}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
          {done ? "Done!" : `of ${goal}`}
        </span>
      </div>
    </div>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  const lower = reason.toLowerCase();
  let color = "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  let Icon = BookOpen;

  if (lower.includes("overdue")) {
    color = "bg-red-500/10 text-red-700 dark:text-red-400";
    Icon = AlertCircle;
  } else if (lower.includes("exam")) {
    color = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    Icon = Clock;
  } else if (lower.includes("weak")) {
    color = "bg-orange-500/10 text-orange-700 dark:text-orange-400";
    Icon = AlertCircle;
  } else if (lower.includes("new")) {
    color = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    Icon = Sparkles;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        color,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {reason}
    </span>
  );
}

export function DailyStudyPlanCard() {
  const [data, setData] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalOpen, setGoalOpen] = useState(false);

  const fetchPlan = useCallback(() => {
    fetch("/api/study-plan")
      .then((r) => r.json())
      .then((json: { data?: StudyPlanData }) => {
        if (json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPlan();

    const handler = () => fetchPlan();
    window.addEventListener(REVIEW_ACTIVITY_EVENT, handler);
    return () => {
      window.removeEventListener(REVIEW_ACTIVITY_EVENT, handler);
    };
  }, [fetchPlan]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 animate-pulse min-h-[12rem]" />
    );
  }

  if (!data) return null;

  const { plan, dailyGoal, reviewed, remaining } = data;
  const allDone = remaining <= 0;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Today&apos;s Study Plan
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {allDone
                  ? "You've hit your daily goal!"
                  : `${remaining} card${remaining !== 1 ? "s" : ""} left to reach your goal`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setGoalOpen(true)}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
            aria-label="Edit daily goal"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing reviewed={reviewed} goal={dailyGoal} />

          <div className="flex-1 min-w-0 space-y-1">
            {allDone ? (
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Goal reached! Great work.
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""} today.
                  Come back tomorrow for more.
                </p>
              </div>
            ) : plan.length === 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  No cards need attention right now
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload a PDF or wait for cards to become due.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plan.slice(0, 3).map((deck) => (
                  <div
                    key={deck.deckId}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2 transition hover:border-primary/30"
                  >
                    <span className="text-lg shrink-0" aria-hidden>
                      {deck.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {deck.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <ReasonBadge reason={deck.reason} />
                        <span className="text-[10px] text-muted-foreground">
                          {deck.suggestedCards} card
                          {deck.suggestedCards !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/review/${deck.deckId}?fresh=1`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
                    >
                      <Play className="h-3 w-3" aria-hidden />
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {goalOpen && (
        <StudyGoalDialog
          currentGoal={dailyGoal}
          onClose={() => setGoalOpen(false)}
          onSaved={() => {
            setGoalOpen(false);
            fetchPlan();
          }}
        />
      )}
    </>
  );
}
