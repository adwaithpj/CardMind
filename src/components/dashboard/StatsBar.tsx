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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-stretch">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="glass rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-h-[7.5rem] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 group"
        >
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", color)}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums leading-none">{value}</p>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-2">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
