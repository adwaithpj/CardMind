"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Flame, Star, Clock, ChevronRight, ArrowUpDown } from "lucide-react";
import { Deck } from "@/lib/db/schema";
import { formatRelativeDate, getMasteryPercent } from "@/lib/utils";
import { MasteryRing } from "@/components/progress/MasteryRing";
import { cn } from "@/lib/utils";
import { sortDecksByLastOpened } from "@/lib/decks/sort-by-last-opened";

type SortKey = "lastOpened" | "due" | "recent" | "added" | "alpha" | "mastery";

type DeckRow = Deck & { masteryProgressPercent?: number };

interface DeckGridProps {
  decks: DeckRow[];
}

export function DeckGrid({ decks }: DeckGridProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastOpened");

  const filtered = useMemo(() => {
    let list = decks.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));

    const byMastery = (d: Deck) =>
      getMasteryPercent(d.masteredCards ?? 0, Math.max(d.totalCards ?? 1, 1));

    switch (sort) {
      case "lastOpened":
        list = [...list].sort(sortDecksByLastOpened);
        break;
      case "due":
        list = [...list].sort(
          (a, b) => (b.dueCards ?? 0) - (a.dueCards ?? 0) || (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0)
        );
        break;
      case "recent":
        list = [...list].sort(
          (a, b) =>
            (b.lastStudiedAt ? new Date(b.lastStudiedAt).getTime() : 0) -
            (a.lastStudiedAt ? new Date(a.lastStudiedAt).getTime() : 0)
        );
        break;
      case "added":
        list = [...list].sort(
          (a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0)
        );
        break;
      case "alpha":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "mastery":
        list = [...list].sort((a, b) => byMastery(b) - byMastery(a));
        break;
      default:
        break;
    }
    return list;
  }, [decks, query, sort]);

  if (decks.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-[2.5rem]">
        <div className="w-20 h-20 rounded-[1.5rem] bg-muted flex items-center justify-center mx-auto mb-6">
          <BookOpen size={36} className="text-muted-foreground/40" />
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight">No decks yet</p>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Use <span className="font-semibold text-foreground">Upload PDF</span> in the sidebar or the{" "}
          <span className="font-semibold text-foreground">+</span> button — we&apos;ll generate cards from your file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {decks.length > 3 && (
          <div className="relative max-w-md flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a workspace..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-base"
            />
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown size={16} className="text-muted-foreground" />
          <label htmlFor="deck-sort" className="sr-only">
            Sort decks
          </label>
          <select
            id="deck-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="lastOpened">Last opened</option>
            <option value="due">Most due first</option>
            <option value="recent">Recently studied</option>
            <option value="added">Recently added</option>
            <option value="mastery">Highest mastery</option>
            <option value="alpha">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((deck) => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>

      {filtered.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No results found for &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 text-primary font-bold uppercase tracking-widest text-xs hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}

function DeckCard({ deck }: { deck: DeckRow }) {
  const mastery =
    deck.masteryProgressPercent ??
    getMasteryPercent(deck.masteredCards ?? 0, deck.totalCards ?? 0);
  const hasDue = (deck.dueCards ?? 0) > 0;

  return (
    <Link href={`/decks/${deck.id}`} className="group block h-full">
      <div className="glass rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10" />

        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
              {deck.emoji ?? "📚"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-xl leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {deck.title}
              </h3>
              {deck.sourceFilename && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1 truncate opacity-60">
                  {deck.sourceFilename}
                </p>
              )}
            </div>
          </div>
          <MasteryRing percent={mastery} size={52} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mt-auto">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50">
            <BookOpen size={14} className="opacity-70" />
            {deck.totalCards} cards
          </span>
          {hasDue && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-500">
              <Flame size={14} />
              {deck.dueCards} due
            </span>
          )}
          {(deck.masteredCards ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500">
              <Star size={14} />
              {deck.masteredCards}
            </span>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <Clock size={12} />
            {deck.lastStudiedAt ? formatRelativeDate(deck.lastStudiedAt) : "Never studied"}
          </div>
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-all",
              hasDue ? "text-primary group-hover:gap-2" : "text-muted-foreground/40"
            )}
          >
            {hasDue ? "Study Now" : "View Deck"} <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
