import type { ReactNode } from "react";

type BadgeTone = "gold" | "green" | "red" | "neutral" | "solidGreen";

const TONE_CLASSES: Record<BadgeTone, string> = {
  gold: "bg-gold-500/15 text-gold-600 border-gold-500/40",
  green: "bg-board-700/10 text-board-800 border-board-700/30",
  red: "bg-red-500/10 text-red-600 border-red-500/40",
  neutral: "bg-ink-400/10 text-ink-600 border-ink-400/30",
  solidGreen: "bg-board-700 text-washi-100 border-board-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
