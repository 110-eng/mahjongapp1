export type EntryPhase = "open" | "closing_soon" | "closed";

const CLOSING_SOON_HOURS = 24;

/** 募集の受付状況(受付中/締切間近/募集中)を判定する */
export function getEntryPhase(entryDeadline: Date, now: Date = new Date()): EntryPhase {
  const hoursLeft = (entryDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return "closed";
  if (hoursLeft <= CLOSING_SOON_HOURS) return "closing_soon";
  return "open";
}

export const ENTRY_PHASE_LABELS: Record<EntryPhase, string> = {
  open: "受付中",
  closing_soon: "締切間近",
  closed: "募集終了",
};
