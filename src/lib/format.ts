const pad2 = (n: number) => String(n).padStart(2, "0");
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateTime(date: Date): string {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

/** カード表示用の曜日付き短縮日時(例: 8/20(水) 19:00) */
export function formatDateTimeWithWeekday(date: Date): string {
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekday}) ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}`;
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
