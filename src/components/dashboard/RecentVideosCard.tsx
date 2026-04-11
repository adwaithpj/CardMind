"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCachedRecents,
  setCachedRecents,
  type CachedVideo,
} from "@/lib/local-db/video-cache";

type RecentVideo = {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
  cardFront: string;
  createdAt: string;
};

function toCached(v: RecentVideo): CachedVideo {
  return {
    id: v.id,
    videoId: v.videoId,
    title: v.title,
    channelName: v.channelName,
    thumbnailUrl: v.thumbnailUrl,
    videoUrl: v.videoUrl,
    cardFront: v.cardFront,
    createdAt: typeof v.createdAt === "string" ? v.createdAt : String(v.createdAt),
  };
}

export function RecentVideosCard() {
  const [videos, setVideos] = useState<RecentVideo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await getCachedRecents();
      if (cached?.length && !cancelled) {
        setVideos(cached.slice(0, 5) as RecentVideo[]);
        setLoaded(true);
      }

      const res = await fetch("/api/recommendations/recent", {
        credentials: "include",
      });
      if (!res.ok) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const json: { data?: RecentVideo[] } = await res.json();
      const list = json.data?.slice(0, 5) ?? [];
      if (list.length > 0) {
        await setCachedRecents(list.map(toCached));
      }
      if (!cancelled) {
        if (list.length > 0) setVideos(list);
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || videos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Youtube className="h-5 w-5 text-red-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Recent Videos
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex w-48 shrink-0 snap-start flex-col overflow-hidden rounded-xl",
              "border border-border bg-muted/30 transition-colors hover:border-primary/40",
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
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No preview
                </div>
              )}
              <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 p-0.5">
                <ExternalLink className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                {video.title}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {video.channelName}
              </p>
              <p className="mt-1 line-clamp-1 text-[10px] italic text-muted-foreground/70">
                {video.cardFront}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
