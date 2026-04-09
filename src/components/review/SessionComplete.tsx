"use client";

import Link from "next/link";
import { Deck } from "@/lib/db/schema";
import { Trophy, Star, RotateCcw, Home, Flame } from "lucide-react";

interface ReviewResult {
  cardId: string;
  rating: number;
}

interface SessionCompleteProps {
  deck: Deck;
  results: ReviewResult[];
  totalCards: number;
}

export function SessionComplete({ deck, results, totalCards }: SessionCompleteProps) {
  if (results.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">All caught up!</h2>
        <p className="text-muted-foreground mb-6">No cards due right now. Come back later!</p>
        <Link href="/" className="inline-flex items-center gap-2 gradient-brand text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-primary/25 dark:shadow-primary/10 hover:opacity-90 transition">
          <Home size={16} /> Back to decks
        </Link>
      </div>
    );
  }

  const avgRating = results.reduce((s, r) => s + r.rating, 0) / results.length;
  const mastered = results.filter((r) => r.rating >= 4).length;
  const struggling = results.filter((r) => r.rating < 3).length;

  const emoji =
    avgRating >= 4 ? "🏆" : avgRating >= 3 ? "⚡" : avgRating >= 2 ? "💪" : "🔁";

  const message =
    avgRating >= 4
      ? "Outstanding work! You're crushing it."
      : avgRating >= 3
      ? "Great session! Keep the momentum going."
      : avgRating >= 2
      ? "Good effort! Repetition is key."
      : "Tough session, but that's how mastery happens.";

  return (
    <div className="max-w-md mx-auto text-center py-16 animate-slide-up">
      <div className="text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
      <p className="text-muted-foreground mb-8">{message}</p>

      {/* Stats */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-left space-y-4 shadow-sm">
        <StatRow
          icon={<Flame size={16} className="text-orange-500" />}
          label="Cards reviewed"
          value={`${results.length} / ${totalCards}`}
        />
        <StatRow
          icon={<Star size={16} className="text-emerald-500" />}
          label="Recalled well (Good/Easy)"
          value={`${mastered} cards`}
          highlight={mastered > 0}
        />
        {struggling > 0 && (
          <StatRow
            icon={<RotateCcw size={16} className="text-red-400" />}
            label="Need more practice"
            value={`${struggling} cards`}
          />
        )}
        <StatRow
          icon={<Trophy size={16} className="text-indigo-500" />}
          label="Average rating"
          value={`${avgRating.toFixed(1)} / 5`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Link
          href={`/decks/${deck.id}`}
          className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-muted transition text-sm"
        >
          View Deck
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 gradient-brand text-white rounded-xl font-semibold shadow-md shadow-primary/25 dark:shadow-primary/10 hover:opacity-90 transition text-sm"
        >
          <Home size={15} /> Home
        </Link>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span
        className={`text-sm font-semibold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
