"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DeckOption = { id: string; title: string; emoji: string | null };

type ExamSetupDialogProps = {
  decks: DeckOption[];
  onCreated?: () => void;
  triggerClassName?: string;
};

export function ExamSetupDialog({
  decks,
  onCreated,
  triggerClassName,
}: ExamSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [deckId, setDeckId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setError(null);
  }, [loading]);

  const reset = useCallback(() => {
    setTitle("");
    setExamDate("");
    setDeckId("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => titleRef.current?.focus());
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          examDate,
          ...(deckId && { deckId }),
        }),
      });
      const json = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to create exam");

      reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date(Date.now() + 86_400_000)
    .toISOString()
    .split("T")[0];

  const modal =
    open &&
    mounted &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:p-6"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          aria-hidden
          onClick={close}
          disabled={loading}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-setup-title"
          className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </div>
              <h2
                id="exam-setup-title"
                className="text-lg font-semibold text-foreground"
              >
                Set exam date
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={loading}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="exam-title"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Exam title
              </label>
              <input
                ref={titleRef}
                id="exam-title"
                type="text"
                required
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Organic Chemistry Final"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
              />
            </div>

            <div>
              <label
                htmlFor="exam-date"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Exam date
              </label>
              <input
                id="exam-date"
                type="date"
                required
                min={minDate}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition [color-scheme:auto]"
              />
            </div>

            <div>
              <label
                htmlFor="exam-deck"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Linked deck{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <select
                id="exam-deck"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
              >
                <option value="">All decks (overall progress)</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.emoji ?? "📚"} {d.title}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !examDate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Create countdown
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground",
          "hover:bg-muted/80 hover:border-primary/30 transition shadow-sm",
          triggerClassName,
        )}
      >
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
        Set exam date
      </button>
      {modal}
    </>
  );
}
