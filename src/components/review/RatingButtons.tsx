"use client";

import { Card } from "@/lib/db/schema";
import { getNextReviewLabel } from "@/lib/srs/sm2";
import { cn } from "@/lib/utils";

interface RatingButtonsProps {
  card: Card;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

const RATINGS = [
  {
    rating: 0,
    label: "Again",
    sublabel: "Blackout",
    panel:
      "bg-red-500/10 hover:bg-red-500/15 border-red-500/25 dark:bg-red-950/45 dark:hover:bg-red-950/60 dark:border-red-900/40",
    text: "text-red-600 dark:text-red-400",
    kbd: "1",
  },
  {
    rating: 2,
    label: "Hard",
    sublabel: "Difficult",
    panel:
      "bg-orange-500/10 hover:bg-orange-500/15 border-orange-500/25 dark:bg-orange-950/35 dark:hover:bg-orange-950/50 dark:border-orange-900/35",
    text: "text-orange-600 dark:text-orange-400",
    kbd: "2",
  },
  {
    rating: 3,
    label: "Good",
    sublabel: "Got it",
    panel:
      "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/25 dark:bg-blue-950/40 dark:hover:bg-blue-950/55 dark:border-blue-900/35",
    text: "text-blue-600 dark:text-blue-400",
    kbd: "3",
  },
  {
    rating: 5,
    label: "Easy",
    sublabel: "Perfect",
    panel:
      "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/55 dark:border-emerald-900/35",
    text: "text-emerald-600 dark:text-emerald-400",
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
        {RATINGS.map(({ rating, label, sublabel, panel, text, kbd }) => {
          const nextReview = getNextReviewLabel(rating, cardForSM2);
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onRate(rating)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-150 disabled:opacity-60",
                panel
              )}
            >
              <span className={cn("font-semibold text-sm", text)}>{label}</span>
              <span className="text-xs text-muted-foreground">{sublabel}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{nextReview}</span>
              <kbd className="text-[10px] bg-muted/80 border border-border px-1.5 py-0.5 rounded text-muted-foreground mt-0.5">
                {kbd}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
