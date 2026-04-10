"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, Loader2, Youtube, ExternalLink, Sparkles, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type DeckOption = { id: string; title: string; emoji: string };

type VideoItem = {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
  cardFront: string | null;
  deckTitle: string | null;
  deckEmoji: string;
  createdAt: string;
};

type SearchResult = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
};

type Props = {
  decks: DeckOption[];
  initialVideos: VideoItem[];
};

export function VideoSearchClient({ decks, initialVideos }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!clearDialogOpen) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !clearing) setClearDialogOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearDialogOpen, clearing]);

  const confirmClear = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/recommendations/recent", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear");
      setClearDialogOpen(false);
      router.refresh();
    } catch {
      setError("Failed to clear recommendations");
    } finally {
      setClearing(false);
    }
  }, [router]);

  const handleSearch = useCallback(async () => {
    const searchQuery = query.trim();
    if (!searchQuery && !selectedDeck) return;

    setSearching(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/recommendations/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, deckId: selectedDeck || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setSearchResults(json.data?.videos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSearching(false);
    }
  }, [query, selectedDeck]);

  return (
    <div className="space-y-6">
      {/* Search controls */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for a topic, concept, or question..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm"
            />
          </div>
          {decks.length > 0 && (
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px]"
            >
              <option value="">All decks</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || (!query.trim() && !selectedDeck)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground",
              "hover:opacity-95 transition disabled:opacity-50 shrink-0"
            )}
          >
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Youtube size={16} />
            )}
            Search Videos
          </button>
        </div>
        {!query.trim() && !selectedDeck && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            Type a topic or select a deck to find relevant YouTube study videos.
          </p>
        )}
      </div>

      {/* Search error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Search results */}
      {searched && !searching && searchResults.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Search Results ({searchResults.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((video) => (
              <VideoCard key={video.videoId} video={video} />
            ))}
          </div>
        </section>
      )}

      {searched && !searching && searchResults.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
          <Youtube size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No videos found for this search.</p>
          <p className="text-xs mt-1">Try different keywords or select a specific deck.</p>
        </div>
      )}

      {/* Recent recommendations */}
      {initialVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Recommendations</h2>
            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive dark:text-red-400",
                "hover:bg-destructive/10 hover:border-destructive/50 transition"
              )}
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialVideos.map((video) => (
              <a
                key={video.id}
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Youtube size={24} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-foreground leading-snug">
                    {video.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
                  {video.deckTitle && (
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      {video.deckEmoji} {video.deckTitle}
                      {video.cardFront && ` · ${video.cardFront}`}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Clear confirmation dialog */}
      {clearDialogOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:p-6" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden
            onClick={() => !clearing && setClearDialogOpen(false)}
            disabled={clearing}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-recs-title"
            aria-describedby="clear-recs-desc"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="clear-recs-title" className="text-lg font-semibold text-foreground">
                  Clear all recommendations?
                </h2>
                <p id="clear-recs-desc" className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  This will permanently remove all saved video recommendations from your library.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setClearDialogOpen(false)}
                disabled={clearing}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClear}
                disabled={clearing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-95 transition disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Clearing…
                  </>
                ) : (
                  "Clear all"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function VideoCard({ video }: { video: SearchResult }) {
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Youtube size={24} className="text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-foreground leading-snug">{video.title}</p>
        <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
      </div>
    </a>
  );
}
