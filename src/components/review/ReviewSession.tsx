"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Loader2, Save } from "lucide-react";
import { Card, Deck } from "@/lib/db/schema";
import { Flashcard } from "./Flashcard";
import { RatingButtons } from "./RatingButtons";
import { SessionComplete } from "./SessionComplete";
import { SessionProgress } from "./SessionProgress";
import type { PendingRating } from "@/lib/review/pending-ratings";
import { syncDecksFromApi } from "@/lib/local-db/sync-decks";
import { notifyReviewActivityChanged } from "@/lib/review/activity-events";
import { cn } from "@/lib/utils";

type SessionPhase = "loading" | "ready" | "complete";

interface ReviewResult {
  cardId: string;
  rating: number;
}

export function ReviewSession({ deck }: { deck: Deck }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fresh = searchParams.get("fresh") === "1";
  const zen = searchParams.get("zen") === "1";
  const modeCram = searchParams.get("mode") === "cram";
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [sessionMode, setSessionMode] = useState<"normal" | "cram" | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [sessionResults, setSessionResults] = useState<ReviewResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPatch = useCallback(
    (idx: number, pending: PendingRating[]) => {
      if (!sessionId) return;
      if (patchTimer.current) clearTimeout(patchTimer.current);
      patchTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/review/session/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentIndex: idx, pendingRatings: pending }),
          });
          if (res.ok) notifyReviewActivityChanged();
        } catch {
          /* debounced — next action will retry */
        }
      }, 500);
    },
    [sessionId]
  );

  const loadSession = useCallback(async () => {
    const q = new URLSearchParams({ deckId: deck.id });
    if (fresh) q.set("fresh", "1");
    if (modeCram) q.set("mode", "cram");
    const r = await fetch(`/api/review/session?${q.toString()}`);
    const json = await r.json();
    if (!r.ok || !json.data) {
      setPhase("complete");
      return;
    }
    const d = json.data;
    if (!d.cards?.length) {
      setPhase("complete");
      return;
    }
    setSessionId(d.sessionId);
    setCards(d.cards);
    setCurrentIndex(d.currentIndex ?? 0);
    setPendingRatings(d.pendingRatings ?? []);
    setSessionMode(d.stats?.mode === "cram" ? "cram" : "normal");
    setPhase("ready");
  }, [deck.id, fresh, modeCram]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    return () => {
      if (patchTimer.current) clearTimeout(patchTimer.current);
    };
  }, []);

  const currentCard = currentIndex < cards.length ? cards[currentIndex] : undefined;
  const awaitingSubmit =
    phase === "ready" &&
    sessionId &&
    currentIndex >= cards.length &&
    pendingRatings.length > 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleRate = useCallback(
    (rating: number) => {
      if (!currentCard || submitting || !sessionId) return;
      setSubmitting(true);

      const nextPending = [...pendingRatings, { cardId: currentCard.id, rating }];
      const nextIndex = currentIndex + 1;

      setPendingRatings(nextPending);
      setCurrentIndex(nextIndex);

      if (nextIndex >= cards.length) {
        if (patchTimer.current) {
          clearTimeout(patchTimer.current);
          patchTimer.current = null;
        }
        void fetch(`/api/review/session/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentIndex: nextIndex,
            pendingRatings: nextPending,
          }),
        })
          .then((res) => {
            if (res.ok) notifyReviewActivityChanged();
          })
          .catch(() => {});
      } else {
        flushPatch(nextIndex, nextPending);
      }

      if (nextIndex >= cards.length) {
        setIsFlipped(false);
      } else {
        setIsFlipped(false);
      }
      setSubmitting(false);
    },
    [currentCard, submitting, sessionId, pendingRatings, currentIndex, flushPatch, cards.length]
  );

  const handleSaveBatch = useCallback(async () => {
    if (!sessionId || pendingRatings.length === 0 || saving) return;
    setSaving(true);
    try {
      if (patchTimer.current) {
        clearTimeout(patchTimer.current);
        patchTimer.current = null;
      }
      await fetch(`/api/review/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentIndex,
          pendingRatings,
        }),
      });

      const res = await fetch("/api/review/submit-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      const submitted = (json.data?.submittedRatings ?? []) as ReviewResult[];
      const complete = Boolean(json.data?.sessionComplete);

      setSessionResults((prev) => [...prev, ...submitted]);
      setPendingRatings([]);

      await syncDecksFromApi();
      notifyReviewActivityChanged();
      router.refresh();

      if (complete) {
        setPhase("complete");
      } else {
        await loadSession();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [
    sessionId,
    pendingRatings,
    currentIndex,
    saving,
    loadSession,
    router,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "ready") return;
      if (awaitingSubmit) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      }
      if (isFlipped && currentCard) {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(3);
        if (e.key === "4") handleRate(5);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, isFlipped, handleFlip, handleRate, awaitingSubmit, currentCard]);

  if (phase === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <SessionComplete
        deck={deck}
        results={sessionResults}
        totalCards={cards.length}
      />
    );
  }

  if (awaitingSubmit) {
    return (
      <div
        className={cn(
          "max-w-2xl mx-auto space-y-8 animate-fade-in py-8",
          zen && "min-h-[60vh] flex flex-col justify-center"
        )}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href={`/decks/${deck.id}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <X size={14} /> Exit
          </Link>
          <p className="text-sm font-medium text-foreground truncate">
            {deck.emoji} {deck.title}
          </p>
          {!zen && <span className="text-sm text-muted-foreground">Review queue</span>}
        </div>

        {sessionMode === "cram" && !zen && (
          <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-xl py-2 px-3">
            Cram mode — all cards in this run; ratings still update SM-2 when you save.
          </p>
        )}

        <div className="rounded-[2rem] border border-border bg-card p-8 sm:p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">All cards rated</p>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            Save once to apply {pendingRatings.length} rating
            {pendingRatings.length !== 1 ? "s" : ""} to spaced repetition.
          </p>
          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={saving}
            className={cn(
              "mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-primary-foreground",
              "gradient-brand shadow-md shadow-primary/25 dark:shadow-primary/10 hover:opacity-95 transition",
              "disabled:opacity-60"
            )}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save &amp; apply reviews
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
        No card in session.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-2xl mx-auto space-y-6 animate-fade-in",
        zen && "min-h-[70vh] flex flex-col justify-center py-4"
      )}
    >
      {zen && (
        <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em]">
          Zen mode
        </p>
      )}
      {sessionMode === "cram" && !zen && (
        <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-xl py-2 px-3">
          Cram mode — scheduling ignored for this session queue. Add{" "}
          <code className="text-[10px]">?zen=1</code> for minimal UI.
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href={`/decks/${deck.id}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <X size={14} /> Exit session
          </Link>
          <p className="text-sm font-medium text-foreground truncate max-w-[40%] sm:max-w-none text-center">
            {deck.emoji} {deck.title}
          </p>
          {!zen && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {currentIndex + 1} / {cards.length}
            </p>
          )}
        </div>
        {pendingRatings.length > 0 && (
          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={saving}
            className={cn(
              "inline-flex items-center justify-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm",
              "hover:bg-muted transition disabled:opacity-50"
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save queue ({pendingRatings.length})
          </button>
        )}
      </div>

      {!zen && <SessionProgress current={currentIndex} total={cards.length} />}

      <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} zen={zen} />

      {isFlipped ? (
        <RatingButtons
          card={currentCard}
          onRate={handleRate}
          disabled={submitting || saving}
        />
      ) : (
        <div className="text-center">
          <button
            type="button"
            onClick={handleFlip}
            className="gradient-brand text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition shadow-md shadow-primary/25 dark:shadow-primary/10"
          >
            Show Answer
          </button>
          {!zen && (
            <p className="text-xs text-muted-foreground mt-3">
              Press{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
                Space
              </kbd>{" "}
              to flip
            </p>
          )}
        </div>
      )}
    </div>
  );
}
