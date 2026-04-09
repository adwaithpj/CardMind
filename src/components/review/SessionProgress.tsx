interface SessionProgressProps {
  /** 0-based index of the current card in the queue (matches ReviewSession `currentIndex`). */
  current: number;
  total: number;
}

/**
 * Position in session (1-based), aligned with the "n / total" header — not "cards completed"
 * so the bar moves on the first card instead of staying at 0%.
 */
export function SessionProgress({ current, total }: SessionProgressProps) {
  const pct =
    total > 0
      ? Math.min(100, ((Math.min(current, total - 1) + 1) / total) * 100)
      : 0;

  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full gradient-brand rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
