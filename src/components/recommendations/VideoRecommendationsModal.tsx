"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Loader2, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

type Video = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
};

type CardRecommendation = {
  cardId: string;
  deckId: string;
  videos: Video[];
};

type Props = {
  cardIds: string[];
  onClose: () => void;
};

export function VideoRecommendationsModal({ cardIds, onClose }: Props) {
  const [recommendations, setRecommendations] = useState<
    CardRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/recommendations/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardIds }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setRecommendations(json.data?.recommendations ?? []);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Failed to load recommendations");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [cardIds]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const allVideos = recommendations.flatMap((r) =>
    r.videos.map((v) => ({ ...v, cardId: r.cardId })),
  );

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Video Recommendations
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Searching YouTube for related videos...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && allVideos.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Youtube className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No videos found</p>
              <p className="text-xs max-w-xs text-center">
                YouTube didn&apos;t return results for these card topics. Try the{" "}
                <a href="/videos" className="text-primary hover:underline font-medium">Videos page</a>{" "}
                to search manually.
              </p>
            </div>
          )}

          {!loading && allVideos.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {allVideos.map((video) => (
                <a
                  key={`${video.cardId}-${video.videoId}`}
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border border-border",
                    "bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/60",
                  )}
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
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                      <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium text-foreground leading-snug">
                      {video.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.channelName}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
