import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatDueDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);

  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff < 7) return `Due in ${diff} days`;
  if (diff < 30) return `Due in ${Math.floor(diff / 7)}w`;
  return `Due in ${Math.floor(diff / 30)}mo`;
}

export function getMasteryPercent(
  mastered: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((mastered / total) * 100);
}

export function getMasteryColor(percent: number): string {
  if (percent >= 70) return "text-green-500";
  if (percent >= 40) return "text-yellow-500";
  return "text-red-500";
}

export function getMasteryStrokeColor(percent: number): string {
  if (percent >= 70) return "#22c55e";
  if (percent >= 40) return "#f59e0b";
  return "#ef4444";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
