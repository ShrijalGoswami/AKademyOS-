import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number, max: number): string {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return `${score}/${max} (${pct}%)`;
}

export function getScoreColor(score: number, max: number): string {
  if (max === 0) return "text-text-muted";
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-success";
  if (pct >= 60) return "text-warning";
  return "text-danger";
}
