import Link from "next/link";
import { Flame, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyActivitySummary } from "@/lib/stats/study-activity";

function heatColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 3) return "bg-primary/30";
  if (count <= 8) return "bg-primary/55";
  if (count <= 15) return "bg-primary/75";
  return "bg-primary";
}

export function StudyMomentumCard({ data }: { data: StudyActivitySummary }) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Study streak
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-foreground">
              {data.currentStreak}
            </span>
            <span className="text-muted-foreground text-sm">day{data.currentStreak !== 1 ? "s" : ""}</span>
            <Flame
              className={cn(
                "inline h-6 w-6 mb-1",
                data.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/40"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Best streak: <span className="font-semibold text-foreground">{data.bestStreak}</span> · Last 7
            days:{" "}
            <span className="font-semibold text-foreground">{data.reviewsLast7Days}</span> reviews
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-x-auto pb-1 min-h-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Last 12 weeks (GitHub-style)
        </p>
        <div className="flex flex-col gap-1 min-w-[200px]">
          {Array.from({ length: 7 }).map((_, day) => (
            <div key={day} className="grid grid-cols-12 gap-1">
              {Array.from({ length: 12 }).map((__, week) => {
                const idx = week * 7 + day;
                const cell = data.contribution[idx];
                if (!cell) return <div key={`${week}-${day}`} />;
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} reviews`}
                    className={cn(
                      "aspect-square min-h-[10px] max-h-4 w-full rounded-sm transition-colors",
                      heatColor(cell.count)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Darker = more reviews that day</p>
      </div>
    </div>
  );
}

export function FirstReviewBanner({
  deckId,
  deckTitle,
  emoji,
  cardCount,
}: {
  deckId: string;
  deckTitle: string;
  emoji: string;
  cardCount: number;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">First session</p>
        <p className="text-foreground font-semibold mt-1">
          Start your first review — ~{Math.max(5, Math.ceil(cardCount * 0.5))} min for {cardCount} cards
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {emoji} {deckTitle}
        </p>
      </div>
      <Link
        href={`/review/${deckId}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition shrink-0"
      >
        <Play size={18} />
        Start first review
      </Link>
    </div>
  );
}
