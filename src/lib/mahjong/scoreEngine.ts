/**
 * 対局スコア計算エンジン(仕様24〜25章)。
 *
 * UIから独立した純粋なドメインロジック。GroupRuleの値をそのまま
 * ruleSnapshotとして受け取り、最終持ち点から順位・ポイント内訳を算出する。
 *
 * 重要: 素点・ウマ・オカ・チップ・ペナルティの正式な計算式は、Timewitch/各Groupの
 * 実際のルールが不明なため、一般的なリーチ麻雀の慣習(1000点差=1.0pt換算)に
 * 基づく暫定的な実装としている。GroupRuleで値を調整できる構造にすることで、
 * 正式ルールが判明した場合でもUI/データモデルを変えずに対応できるようにしている。
 */

export type RoundingRule = "round" | "floor" | "ceil";
export type TieRule = "seat_order" | "shared_rank";

export type RuleSnapshot = {
  startingPoints: number;
  returnPoints: number;
  umaFirst: number;
  umaSecond: number;
  umaThird: number;
  umaFourth: number;
  okaEnabled: boolean;
  chipEnabled: boolean;
  chipValue: number;
  redDoraChipEnabled: boolean;
  ippatsuChipEnabled: boolean;
  uraDoraChipEnabled: boolean;
  bustPenaltyEnabled: boolean;
  bustPenaltyValue: number;
  yakitoriEnabled: boolean;
  roundingRule: RoundingRule;
  tieRule: TieRule;
};

export const DEFAULT_RULE_SNAPSHOT: RuleSnapshot = {
  startingPoints: 25000,
  returnPoints: 30000,
  umaFirst: 20,
  umaSecond: 10,
  umaThird: -10,
  umaFourth: -20,
  okaEnabled: true,
  chipEnabled: false,
  chipValue: 100,
  redDoraChipEnabled: false,
  ippatsuChipEnabled: false,
  uraDoraChipEnabled: false,
  bustPenaltyEnabled: false,
  bustPenaltyValue: 0,
  yakitoriEnabled: false,
  roundingRule: "round",
  tieRule: "seat_order",
};

export type PlayerInput = {
  userId: string;
  /** 同点処理("seat_order")の判定・表示順に使う座席順(0始まり)。一意である必要がある。 */
  seatOrder: number;
  finalScore: number;
  chipCount?: number;
};

export type PlayerResult = {
  userId: string;
  seatOrder: number;
  finalScore: number;
  rank: number;
  rawScorePoint: number;
  umaPoint: number;
  okaPoint: number;
  chipCount: number;
  chipPoint: number;
  penaltyPoint: number;
  totalRankingPoint: number;
};

/** value(単位:pt)を小数第1位で丸める。roundingRuleが素点/チップ/ペナルティ換算全体に適用される。 */
function roundToTenth(value: number, rule: RoundingRule): number {
  const scaled = value * 10;
  const rounded =
    rule === "floor" ? Math.floor(scaled) : rule === "ceil" ? Math.ceil(scaled) : Math.round(scaled);
  return rounded / 10;
}

/**
 * 4人分の最終持ち点から、順位とポイント内訳を算出する。
 * ランキングの強さ判定に使うだけで、参加者レコメンドには一切使用しないこと(仕様13章)。
 */
export function calculateGameResults(
  players: PlayerInput[],
  rule: RuleSnapshot
): PlayerResult[] {
  if (players.length !== 4) {
    throw new Error("対局は4人分の入力が必要です");
  }
  const seatOrders = new Set(players.map((p) => p.seatOrder));
  if (seatOrders.size !== players.length) {
    throw new Error("seatOrderが重複しています");
  }

  const ordered = [...players].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return a.seatOrder - b.seatOrder;
  });

  const uma = [rule.umaFirst, rule.umaSecond, rule.umaThird, rule.umaFourth];
  const okaPool = rule.okaEnabled
    ? ((rule.returnPoints - rule.startingPoints) * players.length) / 1000
    : 0;

  // 同点グループを決定する。seat_orderの場合はsort時点で全順位が確定済みなので単独グループ。
  const groups: number[][] = [];
  if (rule.tieRule === "shared_rank") {
    let i = 0;
    while (i < ordered.length) {
      let j = i + 1;
      while (j < ordered.length && ordered[j].finalScore === ordered[i].finalScore) j++;
      groups.push(Array.from({ length: j - i }, (_, k) => i + k));
      i = j;
    }
  } else {
    ordered.forEach((_, i) => groups.push([i]));
  }

  const results: PlayerResult[] = new Array(ordered.length);

  for (const group of groups) {
    const rank = group[0] + 1; // 標準的な"1,2,2,4"競技順位方式
    const umaShare = group.reduce((sum, idx) => sum + uma[idx], 0) / group.length;
    const isTopGroup = group[0] === 0;
    const okaShare = isTopGroup ? okaPool / group.length : 0;

    for (const idx of group) {
      const p = ordered[idx];
      const rawScorePoint = roundToTenth(
        (p.finalScore - rule.returnPoints) / 1000,
        rule.roundingRule
      );
      const chipCount = p.chipCount ?? 0;
      const chipPoint = rule.chipEnabled
        ? roundToTenth((chipCount * rule.chipValue) / 1000, rule.roundingRule)
        : 0;
      const penaltyPoint =
        rule.bustPenaltyEnabled && p.finalScore < 0
          ? -roundToTenth(rule.bustPenaltyValue / 1000, rule.roundingRule)
          : 0;
      const totalRankingPoint = rawScorePoint + umaShare + okaShare + chipPoint + penaltyPoint;

      results[idx] = {
        userId: p.userId,
        seatOrder: p.seatOrder,
        finalScore: p.finalScore,
        rank,
        rawScorePoint,
        umaPoint: umaShare,
        okaPoint: okaShare,
        chipCount,
        chipPoint,
        penaltyPoint,
        totalRankingPoint: Math.round(totalRankingPoint * 10) / 10,
      };
    }
  }

  return results;
}

/** PrismaのGroupRuleモデルから、Game作成時にコピーするRuleSnapshotを組み立てる(仕様18章) */
export function toRuleSnapshot(rule: {
  startingPoints: number;
  returnPoints: number;
  umaFirst: number;
  umaSecond: number;
  umaThird: number;
  umaFourth: number;
  okaEnabled: boolean;
  chipEnabled: boolean;
  chipValue: number;
  redDoraChipEnabled: boolean;
  ippatsuChipEnabled: boolean;
  uraDoraChipEnabled: boolean;
  bustPenaltyEnabled: boolean;
  bustPenaltyValue: number;
  yakitoriEnabled: boolean;
  roundingRule: string;
  tieRule: string;
}): RuleSnapshot {
  return {
    startingPoints: rule.startingPoints,
    returnPoints: rule.returnPoints,
    umaFirst: rule.umaFirst,
    umaSecond: rule.umaSecond,
    umaThird: rule.umaThird,
    umaFourth: rule.umaFourth,
    okaEnabled: rule.okaEnabled,
    chipEnabled: rule.chipEnabled,
    chipValue: rule.chipValue,
    redDoraChipEnabled: rule.redDoraChipEnabled,
    ippatsuChipEnabled: rule.ippatsuChipEnabled,
    uraDoraChipEnabled: rule.uraDoraChipEnabled,
    bustPenaltyEnabled: rule.bustPenaltyEnabled,
    bustPenaltyValue: rule.bustPenaltyValue,
    yakitoriEnabled: rule.yakitoriEnabled,
    roundingRule: (rule.roundingRule as RoundingRule) ?? "round",
    tieRule: (rule.tieRule as TieRule) ?? "seat_order",
  };
}

/** Game.ruleSnapshot(JSON文字列)をパースする */
export function parseRuleSnapshot(json: string): RuleSnapshot {
  return JSON.parse(json) as RuleSnapshot;
}

/** 入力バリデーション用: 持ち点合計のずれとチップ合計のずれを返す(強制ブロックはしない/仕様21章) */
export function validatePlayerInputs(
  players: { finalScore: number; chipCount?: number }[],
  rule: RuleSnapshot
) {
  const expectedTotal = rule.startingPoints * players.length;
  const actualTotal = players.reduce((sum, p) => sum + p.finalScore, 0);
  const scoreDiff = actualTotal - expectedTotal;

  const chipTotal = players.reduce((sum, p) => sum + (p.chipCount ?? 0), 0);

  return {
    expectedTotal,
    actualTotal,
    scoreDiff,
    isScoreBalanced: scoreDiff === 0,
    chipTotal,
    isChipBalanced: !rule.chipEnabled || chipTotal === 0,
  };
}
