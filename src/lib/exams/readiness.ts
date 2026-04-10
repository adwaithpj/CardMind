type ReadinessInput = {
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  examDate: Date;
};

export type ReadinessResult = {
  daysRemaining: number;
  readinessPercent: number;
  dailyGoal: number;
  dueToday: number;
  status: "on_track" | "behind" | "completed" | "overdue";
  message: string;
};

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const { totalCards, masteredCards, dueCards, examDate } = input;
  const now = new Date();
  const msPerDay = 86_400_000;
  const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / msPerDay));

  if (totalCards === 0) {
    return { daysRemaining, readinessPercent: 100, dailyGoal: 0, dueToday: 0, status: "completed", message: "No cards to study." };
  }

  const readinessPercent = Math.round((masteredCards / totalCards) * 100);

  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      readinessPercent,
      dailyGoal: 0,
      dueToday: dueCards,
      status: readinessPercent >= 80 ? "completed" : "overdue",
      message: readinessPercent >= 80 ? "Exam day — you're ready!" : "Exam day — review as much as you can.",
    };
  }

  const remaining = Math.max(0, totalCards - masteredCards);
  const dailyGoal = Math.max(10, Math.ceil(remaining / daysRemaining));
  const effectiveDue = Math.max(dueCards, dailyGoal);

  if (readinessPercent >= 90) {
    const msg = dueCards > 0
      ? `You're on track — ${dueCards} card${dueCards !== 1 ? "s" : ""} due today.`
      : "You're on track — keep reviewing to stay sharp.";
    return { daysRemaining, readinessPercent, dailyGoal: effectiveDue, dueToday: dueCards, status: "on_track", message: msg };
  }

  const paceNeeded = remaining / daysRemaining;
  if (paceNeeded <= 15) {
    return {
      daysRemaining,
      readinessPercent,
      dailyGoal: effectiveDue,
      dueToday: dueCards,
      status: "on_track",
      message: `Study ${effectiveDue} cards/day to stay on track.${dueCards > 0 ? ` ${dueCards} due today.` : ""}`,
    };
  }

  const extraMinutes = Math.ceil((paceNeeded - 15) * 0.5);
  return {
    daysRemaining,
    readinessPercent,
    dailyGoal: effectiveDue,
    dueToday: dueCards,
    status: "behind",
    message: `You need ~${extraMinutes} more min/day to master all cards by exam day.${dueCards > 0 ? ` ${dueCards} due today.` : ""}`,
  };
}
