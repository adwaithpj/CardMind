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

class CardMindDexie extends Dexie {
  decks!: EntityTable<LocalDeckRecord, "id">;

  constructor() {
    super("CardMindLocal");
    this.version(1).stores({
      decks: "id, userId, updatedAt",
    });
  }
}

export const localDb = new CardMindDexie();
