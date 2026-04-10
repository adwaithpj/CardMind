"use client";

import { Card } from "@/lib/db/schema";
import { getNextReviewLabel } from "@/lib/srs/sm2";
import { cn } from "@/lib/utils";

interface RatingButtonsProps {
  card: Card;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

/** Light mode: white cards + saturated borders (pastel fills look muddy on the blue dashboard wash). */
const RATINGS = [
  {
    rating: 0,
    label: "Again",
    sublabel: "Blackout",
    panel:
      " bg-red-900 hover:bg-red-950  dark:bg-red-950/45 dark:hover:bg-red-950/60 dark:border dark:border-red-900/40 dark:shadow-none",
    text: "text-red-700 dark:text-red-400",
    secondary: "text-slate-600 dark:text-muted-foreground",
    kbdBox:
      "bg-red-100 border border-red-200 text-red-800 dark:bg-muted/80 dark:border-border dark:text-muted-foreground",
    kbd: "1",
  },
  {
    rating: 2,
    label: "Hard",
    sublabel: "Difficult",
    panel:
      "bg-orange-50 border-2 border-orange-600 shadow-sm hover:bg-orange-100 hover:border-orange-700 transition-all duration-150 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 dark:border dark:border-orange-900/40 dark:shadow-none",
    text: "text-orange-700 dark:text-orange-400",
    secondary: "text-slate-600 dark:text-muted-foreground",
    kbdBox:
      "bg-orange-100 border border-orange-200 text-orange-800 dark:bg-muted/80 dark:border-border dark:text-muted-foreground",
    kbd: "2",
  },
  {
    rating: 3,
    label: "Good",
    sublabel: "Got it",
    panel:
      "bg-sky-50 border-2 border-sky-600 shadow-sm hover:bg-sky-100 hover:border-sky-700 transition-all duration-150 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:border dark:border-blue-900/40 dark:shadow-none",
    text: "text-sky-800 dark:text-blue-400",
    secondary: "text-slate-600 dark:text-muted-foreground",
    kbdBox:
      "bg-sky-100 border border-sky-200 text-sky-800 dark:bg-muted/80 dark:border-border dark:text-muted-foreground",
    kbd: "3",
  },
  {
    rating: 5,
    label: "Easy",
    sublabel: "Perfect",
    panel:
      "bg-emerald-50 border-2 border-emerald-600 shadow-sm hover:bg-emerald-100 hover:border-emerald-700 transition-all duration-150 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:border dark:border-emerald-900/40 dark:shadow-none",
    text: "text-emerald-800 dark:text-emerald-400",
    secondary: "text-slate-600 dark:text-muted-foreground",
    kbdBox:
      "bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-muted/80 dark:border-border dark:text-muted-foreground",
    kbd: "4",
  },
];

export function RatingButtons({ card, onRate, disabled }: RatingButtonsProps) {
  const cardForSM2 = {
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <p className="text-center text-xs text-muted-foreground font-medium">
        How well did you know this?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {RATINGS.map(
          ({
            rating,
            label,
            sublabel,
            panel,
            text,
            secondary,
            kbdBox,
            kbd,
          }) => {
            const nextReview = getNextReviewLabel(rating, cardForSM2);
            return (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-150 disabled:opacity-60",
                  panel,
                )}
              >
                <span className={cn("font-semibold text-sm", text)}>
                  {label}
                </span>
                <span className={cn("text-xs", secondary)}>{sublabel}</span>
                <span className={cn("text-xs mt-0.5", secondary)}>
                  {nextReview}
                </span>
                <kbd
                  className={cn(
                    "text-[10px] border px-1.5 py-0.5 rounded mt-0.5 font-mono",
                    kbdBox,
                  )}
                >
                  {kbd}
                </kbd>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
