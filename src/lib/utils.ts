import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function isNow(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
}

export function isNext(
  startTime: string | null,
  allItems: { start_time: string | null; end_time: string | null }[]
): boolean {
  if (!startTime) return false;
  const now = new Date();
  const start = new Date(startTime);

  // If already started, not "next"
  if (now >= start) return false;

  // Find items that haven't started yet
  const futureItems = allItems
    .filter((item) => item.start_time && new Date(item.start_time) > now)
    .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());

  // Is this the next one?
  return futureItems[0]?.start_time === startTime;
}

export function generatePasscode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
