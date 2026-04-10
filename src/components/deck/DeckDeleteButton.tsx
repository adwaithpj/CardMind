"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { removeLocalDecks } from "@/lib/local-db/sync-decks";
import { notifyReviewActivityChanged } from "@/lib/review/activity-events";
import { cn } from "@/lib/utils";

type DeckDeleteButtonProps = {
  deckId: string;
  deckTitle: string;
  className?: string;
};

export function DeckDeleteButton({ deckId, deckTitle, className }: DeckDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setError(null);
  }, [loading]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function confirmDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      const json = (await res.json()) as { data?: unknown; error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete deck");

      await removeLocalDecks([deckId]);
      notifyReviewActivityChanged();
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
          aria-labelledby="deck-delete-title"
          aria-describedby="deck-delete-desc"
          className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="deck-delete-title" className="text-lg font-semibold text-foreground">
                Delete deck?
              </h2>
              <p id="deck-delete-desc" className="mt-2 text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{deckTitle}</span> and all of its cards
                and review history will be removed permanently. This cannot be undone.
              </p>
              {error && (
                <p
                  className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={close}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive dark:text-red-400",
          "hover:bg-destructive/10 hover:border-destructive/50 transition",
          className
        )}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Delete deck
      </button>
      {modal}
    </>
  );
}
