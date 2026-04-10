"use client";

import { Card } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
  /** Minimal chrome: softer labels, no pulse hint (ideas doc §3.1 Zen Mode) */
  zen?: boolean;
}

export function Flashcard({ card, isFlipped, onFlip, zen }: FlashcardProps) {
  return (
    <div className="card-flip-container h-[280px] sm:h-[320px]">
      <motion.div
        className="card-flip-inner cursor-pointer relative"
        onClick={onFlip}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 24,
          mass: 0.85,
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="card-face glass rounded-[2.5rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          {!zen && (
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6 opacity-60">
              Discovery
            </p>
          )}
          <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight tracking-tight text-balance max-w-md">
            {card.front}
          </p>
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 justify-center">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {!zen && (
            <div className="mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest animate-pulse">
              Tap to reveal
            </div>
          )}
        </div>

        <div
          className={cn(
            "card-face card-back-face rounded-[2.5rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center",
            "bg-muted/80 dark:bg-card backdrop-blur-xl border border-border shadow-sm",
            zen && "border-primary/20"
          )}
        >
          {!zen && (
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6 opacity-70">
              Insights
            </p>
          )}
          <div className="overflow-y-auto max-h-full scrollbar-hide py-2">
            <p className="text-lg sm:text-xl font-medium text-foreground leading-relaxed whitespace-pre-wrap max-w-md">
              {card.back}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
