import Dexie, { type EntityTable } from "dexie";

/** Mirrors Prisma Deck fields we cache in IndexedDB for fast local access. */
export type LocalDeckRecord = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  sourceFilename: string | null;
  emoji: string | null;
  totalCards: number;
  newCards: number;
  dueCards: number;
  masteredCards: number;
  createdAt: Date;
  updatedAt: Date;
  lastStudiedAt: Date | null;
};

/** Generic JSON blob cache (video recents, search results). */
export type VideoCacheRow = {
  key: string;
  value: string;
  cachedAt: number;
};

class CardMindDexie extends Dexie {
  decks!: EntityTable<LocalDeckRecord, "id">;
  videoCache!: EntityTable<VideoCacheRow, "key">;

  constructor() {
    super("CardMindLocal");
    this.version(1).stores({
      decks: "id, userId, updatedAt",
    });
    this.version(2).stores({
      decks: "id, userId, updatedAt",
      videoCache: "key, cachedAt",
    });
  }
}

export const localDb = new CardMindDexie();
