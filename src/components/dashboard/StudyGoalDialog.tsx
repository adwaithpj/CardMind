"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  currentGoal: number;
  onClose: () => void;
  onSaved: () => void;
};

const PRESETS = [10, 20, 30, 50];

export function StudyGoalDialog({ currentGoal, onClose, onSaved }: Props) {
  const [value, setValue] = useState(currentGoal);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    const clamped = Math.max(5, Math.min(200, Math.round(value)));
    setSaving(true);
    try {
      const res = await fetch("/api/study-plan/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyCardTarget: clamped }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [value, onSaved]);

  const dialog = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Daily Study Goal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Set how many cards you want to review each day. The study planner will
          distribute this across your decks by priority.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="goal-input"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Cards per day
            </label>
            <input
              ref={inputRef}
              id="goal-input"
              type="number"
              min={5}
              max={200}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className={cn(
                "w-full rounded-xl border border-border bg-background px-3 py-2.5",
                "text-center text-lg font-semibold tabular-nums text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/40",
              )}
            />
          </div>

          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-primary"
          />

          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setValue(p)}
                className={cn(
                  "flex-1 rounded-lg border py-1.5 text-sm font-medium transition",
                  value === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition",
              saving ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
            )}
          >
            {saving ? "Saving…" : "Save goal"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
