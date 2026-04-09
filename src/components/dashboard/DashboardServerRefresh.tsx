"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { REVIEW_ACTIVITY_CHANGED } from "@/lib/review/activity-events";

/** Revalidates server components (stats, streak, deck counts) when review state changes. */
export function DashboardServerRefresh() {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onActivity = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        router.refresh();
      }, 450);
    };
    window.addEventListener(REVIEW_ACTIVITY_CHANGED, onActivity);
    return () => {
      window.removeEventListener(REVIEW_ACTIVITY_CHANGED, onActivity);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router]);

  return null;
}
