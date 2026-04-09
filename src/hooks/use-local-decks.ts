"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/local-db/decks-db";

/**
 * Reactive read of cached decks (Dexie + useLiveQuery).
 * @see https://dexie.org/docs/Tutorial/React
 */
export function useLocalDecks() {
  return useLiveQuery(
    () => localDb.decks.orderBy("updatedAt").reverse().toArray(),
    []
  );
}
