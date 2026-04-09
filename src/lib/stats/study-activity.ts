import { prisma } from "@/lib/db";

export type StudyActivitySummary = {
  currentStreak: number;
  bestStreak: number;
  reviewsLast7Days: number;
  /** Last 84 days (12 weeks), oldest → newest */
  contribution: { date: string; count: number }[];
};

function dayKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Days with ≥1 review in the lookback window */
function buildDayCounts(
  logs: { reviewedAt: Date }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = dayKeyUTC(log.reviewedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function computeCurrentStreak(activeDays: Set<string>): number {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKeyUTC(d);
    if (activeDays.has(key)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

function computeBestStreak(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T12:00:00Z").getTime();
    const cur = new Date(sortedDays[i] + "T12:00:00Z").getTime();
    const diffDays = Math.round((cur - prev) / 86400000);
    if (diffDays === 1) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }
  return best;
}

export async function getStudyActivitySummary(
  userId: string
): Promise<StudyActivitySummary> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 400);

  const logs = await prisma.reviewLog.findMany({
    where: { userId, reviewedAt: { gte: since } },
    select: { reviewedAt: true },
  });

  const counts = buildDayCounts(logs);
  const activeDays = new Set<string>();
  for (const [day, n] of counts) {
    if (n > 0) activeDays.add(day);
  }

  const currentStreak = computeCurrentStreak(activeDays);
  const sortedUnique = [...activeDays].sort();
  const bestStreak = computeBestStreak(sortedUnique);

  const sevenAgo = new Date();
  sevenAgo.setUTCDate(sevenAgo.getUTCDate() - 7);
  let reviewsLast7Days = 0;
  for (const log of logs) {
    if (log.reviewedAt >= sevenAgo) reviewsLast7Days++;
  }

  const contribution: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKeyUTC(d);
    contribution.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return {
    currentStreak,
    bestStreak,
    reviewsLast7Days,
    contribution,
  };
}
