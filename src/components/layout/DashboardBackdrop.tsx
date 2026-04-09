"use client";

import { SmoothFollower } from "./SmoothFollower";

/**
 * Fixed background + custom cursor follower. Chrome uses `pointer-events-none` on the
 * shell; sidebar and main opt in with `pointer-events-auto` so controls stay clickable.
 */
export function DashboardBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full">
      <div className="fixed inset-0 z-0 bg-background" aria-hidden />
      <div className="pointer-events-none relative z-[1] flex min-h-screen w-full flex-1 bg-transparent">
        {children}
      </div>
      <SmoothFollower />
    </div>
  );
}
