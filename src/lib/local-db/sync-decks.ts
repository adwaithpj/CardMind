import { localDb, type LocalDeckRecord } from "./decks-db";

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}

/** Map JSON from GET /api/decks into Dexie rows (ISO date strings → Date). */
export function mapApiDeckToLocal(d: Record<string, unknown>): LocalDeckRecord {
  return {
    id: String(d.id),
    userId: String(d.userId),
    title: String(d.title),
    description: d.description != null ? String(d.description) : null,
    sourceFilename: d.sourceFilename != null ? String(d.sourceFilename) : null,
    emoji: d.emoji != null ? String(d.emoji) : null,
    totalCards: Number(d.totalCards ?? 0),
    newCards: Number(d.newCards ?? 0),
    dueCards: Number(d.dueCards ?? 0),
    masteredCards: Number(d.masteredCards ?? 0),
    createdAt: parseDate(d.createdAt),
    updatedAt: parseDate(d.updatedAt),
    lastStudiedAt: d.lastStudiedAt != null ? parseDate(d.lastStudiedAt) : null,
  };
}

/** Full sync from server — call after load or when refreshing decks. */
export async function syncDecksFromApi(): Promise<void> {
  const res = await fetch("/api/decks", { credentials: "include" });
  if (!res.ok) return;
  const json: { data?: unknown[] } = await res.json();
  const decks = json.data;
  if (!Array.isArray(decks)) return;
  if (decks.length === 0) {
    await localDb.decks.clear();
    return;
  }
  const rows = decks.map((row) => mapApiDeckToLocal(row as Record<string, unknown>));
  await localDb.decks.bulkPut(rows);
}

/** Remove decks from IndexedDB after server-side delete (single or bulk). */
export async function removeLocalDecks(deckIds: string[]): Promise<void> {
  if (deckIds.length === 0) return;
  await localDb.decks.bulkDelete(deckIds);
}

/** Upsert a deck right after upload (partial payload from POST /api/upload). */
export async function upsertDeckFromUpload(payload: {
  deckId: string;
  title: string;
  cardCount: number;
  userId: string;
}): Promise<void> {
  const now = new Date();
  await localDb.decks.put({
    id: payload.deckId,
    userId: payload.userId,
    title: payload.title,
    description: null,
    sourceFilename: null,
    emoji: "📚",
    totalCards: payload.cardCount,
    newCards: payload.cardCount,
    dueCards: 0,
    masteredCards: 0,
    createdAt: now,
    updatedAt: now,
    lastStudiedAt: null,
  });
}
