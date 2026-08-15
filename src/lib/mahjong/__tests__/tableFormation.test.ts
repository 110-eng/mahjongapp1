import { describe, it, expect } from "vitest";
import { computeTableFormation, needsParticipantSelection } from "../tableFormation";

describe("computeTableFormation", () => {
  it("3人/最大1卓 → あと1人", () => {
    const r = computeTableFormation(3, 1);
    expect(r.tablesFormed).toBe(0);
    expect(r.remainderToNextTable).toBe(1);
    expect(r.subMessage).toContain("あと1人で1卓!");
    expect(r.isOverCapacity).toBe(false);
  });

  it("4人 → 1卓成立、選定不要", () => {
    const r = computeTableFormation(4, 1);
    expect(r.tablesFormed).toBe(1);
    expect(r.isExactlyFull).toBe(true);
    expect(r.headline).toBe("🎉 1卓成立!");
    expect(needsParticipantSelection(4, 1)).toBe(false);
  });

  it("7人/最大2卓(8人) → あと1人で2卓成立、自動落選させない", () => {
    const r = computeTableFormation(7, 2);
    expect(r.tablesFormed).toBe(1);
    expect(r.isOverCapacity).toBe(false);
    expect(r.subMessage).toContain("あと1人で2卓目!");
    expect(needsParticipantSelection(7, 2)).toBe(true);
  });

  it("8人/最大2卓 → 2卓成立、選定不要", () => {
    const r = computeTableFormation(8, 2);
    expect(r.tablesFormed).toBe(2);
    expect(r.isExactlyFull).toBe(true);
    expect(r.headline).toBe("🎉 2卓成立!");
    expect(needsParticipantSelection(8, 2)).toBe(false);
  });

  it("10人/最大2卓(8人) → 参加調整必要", () => {
    const r = computeTableFormation(10, 2);
    expect(r.isOverCapacity).toBe(true);
    expect(r.tablesFormed).toBe(2);
    expect(needsParticipantSelection(10, 2)).toBe(true);
  });

  it("9人/最大3卓(12人) → 2卓成立 あと3人で3卓目", () => {
    const r = computeTableFormation(9, 3);
    expect(r.tablesFormed).toBe(2);
    expect(r.subMessage).toContain("あと3人で3卓目!");
    expect(r.headline).toBe("2卓成立!");
  });

  it("牌配列: 6/8はcapacity(8)分表示され、実entrant6人は東南西北を継続表示、残り2つが空白", () => {
    const r = computeTableFormation(6, 2);
    expect(r.tiles.map((t) => t.label)).toEqual([
      "東",
      "南",
      "西",
      "北",
      "東",
      "南",
      "○",
      "○",
    ]);
  });

  it("牌配列: 3/4は東南西□", () => {
    const r = computeTableFormation(3, 1);
    expect(r.tiles.map((t) => t.label)).toEqual(["東", "南", "西", "○"]);
  });
});
