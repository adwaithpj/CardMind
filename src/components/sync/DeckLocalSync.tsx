"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { syncDecksFromApi } from "@/lib/local-db/sync-decks";

/** Keeps IndexedDB deck cache aligned with GET /api/decks while the user is signed in. */
export function DeckLocalSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    syncDecksFromApi().catch(console.error);
  }, [status]);

  return null;
}
