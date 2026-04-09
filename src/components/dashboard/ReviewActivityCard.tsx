"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { REVIEW_ACTIVITY_CHANGED } from "@/lib/review/activity-events";

type ActiveSession = {
  id: string;
  deckId: string;
  deckTitle: string;
  deckEmoji: string;
  cardsTotal: number;
  currentIndex: number;
  lastActivityAt: string;
  pendingInQueue?: number;
  needsSubmit?: boolean;
};

type RecentDeck = {
  id: string;
  title: string;
  emoji: string | null;
  lastStudiedAt: Date | string | null;
  lastOpenedAt?: Date | string | null;
  totalCards: number;
  dueCards: number;
};

export function ReviewActivityCard() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [recentDeck, setRecentDeck] = useState<RecentDeck | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((json: { data?: unknown }) => {
    if (json.data) {
      const d = json.data as {
        activeSession: ActiveSession | null;
        recentDeck: RecentDeck | null;
      };
      setActiveSession(d.activeSession);
      setRecentDeck(d.recentDeck ?? null);
    }
  }, []);

  const refresh = useCallback(() => {
    fetch("/api/review/active")
      .then((r) => r.json())
      .then(apply)
      .catch(() => {});
  }, [apply]);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch("/api/review/active")
        .then((r) => r.json())
        .then((json) => {
          if (!cancelled) apply(json);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onActivityEvent = () => refresh();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(REVIEW_ACTIVITY_CHANGED, onActivityEvent);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REVIEW_ACTIVITY_CHANGED, onActivityEvent);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [apply, refresh]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 animate-pulse min-h-[8rem]" />
    );
  }

  const progressPct =
    activeSession && activeSession.cardsTotal > 0
      ? activeSession.needsSubmit
        ? 100
        : Math.round(
            (Math.min(activeSession.currentIndex, activeSession.cardsTotal - 1) + 1) /
              activeSession.cardsTotal *
              100
          )
      : 0;

  const showBothTiles = Boolean(activeSession && recentDeck);

  return (
    <div
      className={cn(
        "grid w-full min-w-0 gap-4",
        showBothTiles ? "grid-cols-1 xl:grid-cols-2 xl:items-stretch" : "grid-cols-1"
      )}
    >
      {activeSession && (
        <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-2xl">
                {activeSession.deckEmoji}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {activeSession.needsSubmit ? "Save pending reviews" : "Resume review"}
                </p>
                <p className="font-semibold text-foreground truncate">{activeSession.deckTitle}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeSession.needsSubmit ? (
                    <>
                      {activeSession.pendingInQueue ?? 0} rating
                      {(activeSession.pendingInQueue ?? 0) !== 1 ? "s" : ""} waiting to apply
                    </>
                  ) : (
                    <>
                      Card {Math.min(activeSession.currentIndex + 1, activeSession.cardsTotal)} of{" "}
                      {activeSession.cardsTotal}
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Last activity {formatRelativeDate(activeSession.lastActivityAt)}
                </p>
              </div>
            </div>
            <Link
              href={`/review/${activeSession.deckId}`}
              className={cn(
                "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 lg:w-auto lg:min-w-[8.5rem]",
                "text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition"
              )}
            >
              <PlayCircle size={18} />
              {activeSession.needsSubmit ? "Finish" : "Continue"}
            </Link>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {recentDeck && (
        <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
              {recentDeck.emoji ?? "📚"}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Last opened
              </p>
              <p className="font-semibold text-foreground truncate">{recentDeck.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {recentDeck.totalCards} cards
                </span>
                {recentDeck.dueCards > 0 && (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {recentDeck.dueCards} due
                  </span>
                )}
                {recentDeck.lastOpenedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} />
                    Opened {formatRelativeDate(recentDeck.lastOpenedAt)}
                  </span>
                )}
                {!recentDeck.lastOpenedAt && recentDeck.lastStudiedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} />
                    Studied {formatRelativeDate(recentDeck.lastStudiedAt)}
                  </span>
                )}
              </div>
              <Link
                href={`/decks/${recentDeck.id}`}
                className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Open deck
              </Link>
            </div>
          </div>
        </div>
      )}

      {!activeSession && !recentDeck && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center text-muted-foreground">
          <p className="text-sm">
            Open a deck or start a review to see activity here. Your last opened deck will appear
            after you visit it.
          </p>
        </div>
      )}
    </div>
  );
}
