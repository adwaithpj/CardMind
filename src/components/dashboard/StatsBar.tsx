import { BookOpen, Layers, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  totalDecks: number;
  totalCards: number;
  totalDue: number;
  totalMastered: number;
}

export function StatsBar({ totalDecks, totalCards, totalDue, totalMastered }: StatsBarProps) {
  const stats = [
    {
      label: "Decks",
      value: totalDecks,
      icon: Layers,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      label: "Total Cards",
      value: totalCards,
      icon: BookOpen,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Due Today",
      value: totalDue,
      icon: Flame,
      color: totalDue > 0 ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground bg-muted",
    },
    {
      label: "Mastered",
      value: totalMastered,
      icon: Star,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:gap-6 items-stretch">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="glass rounded-2xl p-3.5 sm:p-4 md:rounded-3xl md:p-5 lg:p-6 flex min-h-[5.75rem] flex-col justify-center gap-2.5 md:min-h-[7rem] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 group"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-110 md:h-11 md:w-11 lg:h-12 lg:w-12 md:rounded-2xl",
                color,
              )}
            >
              <Icon size={20} className="md:h-[22px] md:w-[22px]" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums leading-none md:text-3xl">
              {value}
            </p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:text-xs md:tracking-wider">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
