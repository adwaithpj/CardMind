import { localDb } from "./decks-db";

const KEY_RECENTS = "video_recents";
const SEARCH_PREFIX = "video_search:";

const RECENTS_TTL_MS = 3 * 60 * 1000;
const SEARCH_TTL_MS = 10 * 60 * 1000;

export type CachedVideo = {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
  cardFront: string;
  createdAt: string;
};

export type CachedSearchVideo = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
};

export async function getCachedRecents(): Promise<CachedVideo[] | null> {
  const row = await localDb.videoCache.get(KEY_RECENTS);
  if (!row) return null;
  if (Date.now() - row.cachedAt > RECENTS_TTL_MS) return null;
  try {
    return JSON.parse(row.value) as CachedVideo[];
  } catch {
    return null;
  }
}

export async function setCachedRecents(videos: CachedVideo[]): Promise<void> {
  await localDb.videoCache.put({
    key: KEY_RECENTS,
    value: JSON.stringify(videos),
    cachedAt: Date.now(),
  });
}

export function searchCacheKey(query: string, deckId: string): string {
  return `${SEARCH_PREFIX}${deckId}:${query.trim().toLowerCase()}`;
}

export async function getCachedSearch(
  key: string,
): Promise<CachedSearchVideo[] | null> {
  const row = await localDb.videoCache.get(key);
  if (!row) return null;
  if (Date.now() - row.cachedAt > SEARCH_TTL_MS) return null;
  try {
    return JSON.parse(row.value) as CachedSearchVideo[];
  } catch {
    return null;
  }
}

export async function setCachedSearch(
  key: string,
  videos: CachedSearchVideo[],
): Promise<void> {
  await localDb.videoCache.put({
    key,
    value: JSON.stringify(videos),
    cachedAt: Date.now(),
  });
}

/** Call after clearing recommendations on the server. */
export async function clearRecentsCache(): Promise<void> {
  await localDb.videoCache.delete(KEY_RECENTS);
}
