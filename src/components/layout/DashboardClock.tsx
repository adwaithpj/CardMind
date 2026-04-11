"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted || !now) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[35] select-none",
        "bottom-[9.75rem] right-4 sm:bottom-[9.75rem] sm:right-6 lg:right-8",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "rounded-xl border border-border/80 bg-card/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm",
          "tabular-nums text-[11px] font-semibold tracking-tight text-muted-foreground sm:text-xs",
        )}
      >
        <time dateTime={now.toISOString()}>
          {now.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
