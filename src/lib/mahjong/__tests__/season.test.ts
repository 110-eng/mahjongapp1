import { describe, it, expect } from "vitest";
import { getSeasonYear, getQuarterForDate, getQuarterRange } from "../season";

describe("getSeasonYear", () => {
  it("8/31は前年度シーズンに属する", () => {
    expect(getSeasonYear(new Date(2026, 7, 31))).toBe(2025);
  });

  it("9/1は新年度シーズンに属する", () => {
    expect(getSeasonYear(new Date(2026, 8, 1))).toBe(2026);
  });
});

describe("getQuarterForDate", () => {
  it("9月はQ1", () => {
    expect(getQuarterForDate(new Date(2025, 8, 15)).quarter).toBe(1);
  });

  it("12月はQ2", () => {
    expect(getQuarterForDate(new Date(2025, 11, 15)).quarter).toBe(2);
  });

  it("3月はQ3", () => {
    expect(getQuarterForDate(new Date(2026, 2, 15)).quarter).toBe(3);
  });

  it("6月はQ4", () => {
    expect(getQuarterForDate(new Date(2026, 5, 15)).quarter).toBe(4);
  });

  it("年跨ぎ: 2025年度Q2は2025/12/01〜2026/02/28", () => {
    const range = getQuarterRange(2025, 2);
    expect(range.start).toEqual(new Date(2025, 11, 1, 0, 0, 0, 0));
    expect(range.end).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
  });

  it("うるう年: 2027年度Q2(2028年2月)は29日まで", () => {
    const range = getQuarterRange(2027, 2);
    expect(range.end).toEqual(new Date(2028, 1, 29, 23, 59, 59, 999));
  });

  it("2025年度Q1は2025/09/01〜2025/11/30", () => {
    const range = getQuarterRange(2025, 1);
    expect(range.start).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
    expect(range.end).toEqual(new Date(2025, 10, 30, 23, 59, 59, 999));
  });

  it("2025年度Q4は2026/06/01〜2026/08/31", () => {
    const range = getQuarterRange(2025, 4);
    expect(range.start).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
    expect(range.end).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });
});
