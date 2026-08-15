/**
 * 年間シーズン・クォーター算出ロジック。
 * シーズン境界(9/1〜翌8/31)をハードコードした日付比較にせず、
 * 年度(seasonYear)を基準にDate計算で導出する。
 */

export type Quarter = 1 | 2 | 3 | 4;

export type DateRange = {
  start: Date;
  end: Date;
};

export type QuarterInfo = DateRange & {
  seasonYear: number;
  quarter: Quarter;
  label: string;
};

const startOfDay = (year: number, monthIndex0: number, day: number): Date =>
  new Date(year, monthIndex0, day, 0, 0, 0, 0);

const endOfDay = (year: number, monthIndex0: number, day: number): Date =>
  new Date(year, monthIndex0, day, 23, 59, 59, 999);

/** その月の最終日(うるう年考慮)を返す。monthIndex0は0始まり月。 */
const lastDayOfMonth = (year: number, monthIndex0: number): number =>
  new Date(year, monthIndex0 + 1, 0).getDate();

/** 日付が属する年間シーズンの開始年(例: 2025/09/01〜2026/08/31なら2025)を返す */
export function getSeasonYear(date: Date): number {
  const year = date.getFullYear();
  const monthIndex0 = date.getMonth(); // 0-11
  // 9月(index8)以降なら当年開始のシーズン、それ以前(1〜8月)なら前年開始のシーズン
  return monthIndex0 >= 8 ? year : year - 1;
}

/** シーズン年度(開始年)から年間シーズンの期間を返す */
export function getSeasonRange(seasonYear: number): DateRange {
  return {
    start: startOfDay(seasonYear, 8, 1), // 9/1
    end: endOfDay(seasonYear + 1, 7, 31), // 翌8/31
  };
}

const QUARTER_DEFS: {
  quarter: Quarter;
  // シーズン開始年からの相対年オフセットと月(0始まり)
  startYearOffset: number;
  startMonthIndex0: number;
  endYearOffset: number;
  endMonthIndex0: number;
}[] = [
  { quarter: 1, startYearOffset: 0, startMonthIndex0: 8, endYearOffset: 0, endMonthIndex0: 10 }, // 9/1-11/30
  { quarter: 2, startYearOffset: 0, startMonthIndex0: 11, endYearOffset: 1, endMonthIndex0: 1 }, // 12/1-2月末
  { quarter: 3, startYearOffset: 1, startMonthIndex0: 2, endYearOffset: 1, endMonthIndex0: 4 }, // 3/1-5/31
  { quarter: 4, startYearOffset: 1, startMonthIndex0: 5, endYearOffset: 1, endMonthIndex0: 7 }, // 6/1-8/31
];

/** シーズン年度とクォーター番号からその期間を返す(うるう年のQ2末日を正しく算出) */
export function getQuarterRange(seasonYear: number, quarter: Quarter): QuarterInfo {
  const def = QUARTER_DEFS[quarter - 1];
  const startYear = seasonYear + def.startYearOffset;
  const endYear = seasonYear + def.endYearOffset;
  const endDay = lastDayOfMonth(endYear, def.endMonthIndex0);
  return {
    seasonYear,
    quarter,
    start: startOfDay(startYear, def.startMonthIndex0, 1),
    end: endOfDay(endYear, def.endMonthIndex0, endDay),
    label: `${seasonYear}年度 Q${quarter}`,
  };
}

/** 日付が属するクォーターを返す */
export function getQuarterForDate(date: Date): QuarterInfo {
  const seasonYear = getSeasonYear(date);
  for (const def of QUARTER_DEFS) {
    const range = getQuarterRange(seasonYear, def.quarter);
    if (date >= range.start && date <= range.end) {
      return range;
    }
  }
  // 理論上到達しないが、フォールバックとしてQ4を返す
  return getQuarterRange(seasonYear, 4);
}

/** 指定シーズン年度の全4クォーターを順番に返す */
export function listQuarters(seasonYear: number): QuarterInfo[] {
  return [1, 2, 3, 4].map((q) => getQuarterRange(seasonYear, q as Quarter));
}

export function seasonLabel(seasonYear: number): string {
  return `${seasonYear}年度シーズン (${seasonYear}/09〜${seasonYear + 1}/08)`;
}
