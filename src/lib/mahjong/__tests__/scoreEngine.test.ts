import { describe, it, expect } from "vitest";
import {
  calculateGameResults,
  validatePlayerInputs,
  DEFAULT_RULE_SNAPSHOT,
  type PlayerInput,
  type RuleSnapshot,
} from "../scoreEngine";

const players = (scores: number[]): PlayerInput[] =>
  scores.map((finalScore, i) => ({ userId: `u${i}`, seatOrder: i, finalScore }));

describe("calculateGameResults - basic (no ties)", () => {
  it("素点+ウマ+オカがfinalScore降順で正しく算出される", () => {
    const results = calculateGameResults(players([41200, 28700, 21300, 8800]), DEFAULT_RULE_SNAPSHOT);
    const byRank = [...results].sort((a, b) => a.rank - b.rank);

    expect(byRank.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(byRank[0].userId).toBe("u0");

    // rawScorePoint = (finalScore - 30000) / 1000
    expect(byRank[0].rawScorePoint).toBeCloseTo(11.2);
    expect(byRank[1].rawScorePoint).toBeCloseTo(-1.3);
    expect(byRank[2].rawScorePoint).toBeCloseTo(-8.7);
    expect(byRank[3].rawScorePoint).toBeCloseTo(-21.2);

    // uma: +20/+10/-10/-20
    expect(byRank[0].umaPoint).toBe(20);
    expect(byRank[3].umaPoint).toBe(-20);

    // oka = (30000-25000)*4/1000 = 20, all to rank1
    expect(byRank[0].okaPoint).toBe(20);
    expect(byRank[1].okaPoint).toBe(0);

    // total = raw + uma + oka (no chip/penalty)
    expect(byRank[0].totalRankingPoint).toBeCloseTo(11.2 + 20 + 20);
  });

  it("4人でない場合はエラー", () => {
    expect(() => calculateGameResults(players([100, 200, 300]), DEFAULT_RULE_SNAPSHOT)).toThrow();
  });

  it("seatOrderが重複する場合はエラー", () => {
    const bad: PlayerInput[] = [
      { userId: "a", seatOrder: 0, finalScore: 10000 },
      { userId: "b", seatOrder: 0, finalScore: 20000 },
      { userId: "c", seatOrder: 1, finalScore: 30000 },
      { userId: "d", seatOrder: 2, finalScore: 40000 },
    ];
    expect(() => calculateGameResults(bad, DEFAULT_RULE_SNAPSHOT)).toThrow();
  });
});

describe("calculateGameResults - tie handling", () => {
  const tiedScores = [25000, 25000, 30000, 20000]; // u0,u1 tie for 2nd place after u2

  it("tieRule=seat_order: 同点はseatOrderで完全に順位分けされる", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, tieRule: "seat_order" };
    const results = calculateGameResults(players(tiedScores), rule);
    const byRank = [...results].sort((a, b) => a.rank - b.rank);
    expect(byRank.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    // u2(30000)が1位、u0(seatOrder0)がu1より上の2位
    expect(byRank[0].userId).toBe("u2");
    expect(byRank[1].userId).toBe("u0");
    expect(byRank[2].userId).toBe("u1");
  });

  it("tieRule=shared_rank: 同点は同順位を共有し、ウマは平均配分される", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, tieRule: "shared_rank" };
    const results = calculateGameResults(players(tiedScores), rule);
    const u0 = results.find((r) => r.userId === "u0")!;
    const u1 = results.find((r) => r.userId === "u1")!;
    const u2 = results.find((r) => r.userId === "u2")!;
    const u3 = results.find((r) => r.userId === "u3")!;

    expect(u2.rank).toBe(1);
    expect(u0.rank).toBe(2);
    expect(u1.rank).toBe(2); // 同順位を共有
    expect(u3.rank).toBe(4); // 3位を飛ばして4位(1,2,2,4方式)

    // 2位・3位分のウマ(+10,-10)を平均 = 0
    expect(u0.umaPoint).toBe(0);
    expect(u1.umaPoint).toBe(0);
  });

  it("1位が同点の場合はオカも均等に分配される", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, tieRule: "shared_rank" };
    const results = calculateGameResults(players([30000, 30000, 25000, 15000]), rule);
    const first = results.filter((r) => r.rank === 1);
    expect(first).toHaveLength(2);
    // oka total = 20, split between 2 players = 10 each
    expect(first[0].okaPoint).toBe(10);
    expect(first[1].okaPoint).toBe(10);
  });
});

describe("calculateGameResults - chips / penalty / oka toggle", () => {
  it("chipEnabled=falseの場合チップは無視される", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, chipEnabled: false };
    const input = players([30000, 25000, 25000, 20000]).map((p, i) => ({
      ...p,
      chipCount: i === 0 ? 5 : 0,
    }));
    const results = calculateGameResults(input, rule);
    expect(results.find((r) => r.userId === "u0")!.chipPoint).toBe(0);
  });

  it("chipEnabled=trueの場合チップ枚数×chipValueが反映される(1000点=1.0pt換算)", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, chipEnabled: true, chipValue: 100 };
    const input = players([30000, 25000, 25000, 20000]).map((p, i) => ({
      ...p,
      chipCount: i === 0 ? 3 : 0,
    }));
    const results = calculateGameResults(input, rule);
    // 3枚 × 100点 / 1000 = 0.3pt
    expect(results.find((r) => r.userId === "u0")!.chipPoint).toBeCloseTo(0.3);
  });

  it("okaEnabled=falseの場合オカは加算されない", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, okaEnabled: false };
    const results = calculateGameResults(players([30000, 25000, 25000, 20000]), rule);
    expect(results.every((r) => r.okaPoint === 0)).toBe(true);
  });

  it("bustPenaltyEnabled=trueかつ持ち点マイナスの場合ペナルティが加算される", () => {
    const rule: RuleSnapshot = {
      ...DEFAULT_RULE_SNAPSHOT,
      bustPenaltyEnabled: true,
      bustPenaltyValue: 10000,
    };
    const results = calculateGameResults(players([50000, 30000, 21000, -1000]), rule);
    const busted = results.find((r) => r.userId === "u3")!;
    expect(busted.penaltyPoint).toBeCloseTo(-10);
    const notBusted = results.find((r) => r.userId === "u0")!;
    expect(notBusted.penaltyPoint).toBe(0);
  });
});

describe("calculateGameResults - rounding rule", () => {
  it("roundingRuleによって端数の丸め方が変わる", () => {
    // finalScore=25650 -> (25650-30000)/1000 = -4.35pt
    const base = players([25650, 30000, 25000, 19350]);

    const rounded = calculateGameResults(base, { ...DEFAULT_RULE_SNAPSHOT, roundingRule: "round" });
    const floored = calculateGameResults(base, { ...DEFAULT_RULE_SNAPSHOT, roundingRule: "floor" });
    const ceiled = calculateGameResults(base, { ...DEFAULT_RULE_SNAPSHOT, roundingRule: "ceil" });

    const r = rounded.find((x) => x.userId === "u0")!.rawScorePoint;
    const f = floored.find((x) => x.userId === "u0")!.rawScorePoint;
    const c = ceiled.find((x) => x.userId === "u0")!.rawScorePoint;

    expect(f).toBeLessThanOrEqual(r);
    expect(r).toBeLessThanOrEqual(c);
  });
});

describe("validatePlayerInputs", () => {
  it("持ち点合計が原点合計と一致すればisScoreBalanced=true", () => {
    const v = validatePlayerInputs(
      [{ finalScore: 25000 }, { finalScore: 25000 }, { finalScore: 25000 }, { finalScore: 25000 }],
      DEFAULT_RULE_SNAPSHOT
    );
    expect(v.isScoreBalanced).toBe(true);
    expect(v.scoreDiff).toBe(0);
  });

  it("持ち点合計がずれるとscoreDiffが非ゼロになる", () => {
    const v = validatePlayerInputs(
      [{ finalScore: 41200 }, { finalScore: 28700 }, { finalScore: 21300 }, { finalScore: 8000 }],
      DEFAULT_RULE_SNAPSHOT
    );
    expect(v.isScoreBalanced).toBe(false);
    expect(v.scoreDiff).toBe(-800);
  });

  it("chipEnabled=trueでチップ合計が0でなければisChipBalanced=false", () => {
    const rule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, chipEnabled: true };
    const v = validatePlayerInputs(
      [
        { finalScore: 25000, chipCount: 3 },
        { finalScore: 25000, chipCount: -1 },
        { finalScore: 25000, chipCount: 1 },
        { finalScore: 25000, chipCount: -1 },
      ],
      rule
    );
    expect(v.chipTotal).toBe(2);
    expect(v.isChipBalanced).toBe(false);
  });

  it("chipEnabled=falseならチップの合計に関わらずisChipBalanced=true", () => {
    const v = validatePlayerInputs(
      [{ finalScore: 25000, chipCount: 3 }, { finalScore: 25000 }, { finalScore: 25000 }, { finalScore: 25000 }],
      DEFAULT_RULE_SNAPSHOT
    );
    expect(v.isChipBalanced).toBe(true);
  });
});

describe("rule snapshot immutability", () => {
  it("同じ入力でもruleSnapshotが異なれば結果が異なる(過去対局は変化しないことの根拠)", () => {
    const oldRule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, umaFirst: 20, umaFourth: -20 };
    const newRule: RuleSnapshot = { ...DEFAULT_RULE_SNAPSHOT, umaFirst: 30, umaFourth: -30 };

    const withOldRule = calculateGameResults(players([41200, 28700, 21300, 8800]), oldRule);
    const withNewRule = calculateGameResults(players([41200, 28700, 21300, 8800]), newRule);

    expect(withOldRule.find((r) => r.rank === 1)!.umaPoint).toBe(20);
    expect(withNewRule.find((r) => r.rank === 1)!.umaPoint).toBe(30);
  });
});
