/**
 * 参加者レコメンドロジック(仕様14〜16章)。
 *
 * 目的: 「参加機会を広げるなら、このメンバーがおすすめ」を
 * 説明可能なルールベースで提示する。機械学習・LLMは使わない。
 *
 * 重要: 麻雀の強さ(ranking_point等)は一切使用しない(仕様26章)。
 * 見るのは参加希望・実参加・参加率・最終対局日・初参加のみ。
 */

/** 重みは定数化する(仕様15章) */
export const RECOMMENDATION_WEIGHTS = {
  /** 初参加ボーナス */
  FIRST_TIME_BONUS: 5,
  /** 参加率(低いほど加点)の重み */
  PARTICIPATION_RATE_WEIGHT: 4,
  /** 最終対局からの経過日数1日あたりの重み */
  DAYS_SINCE_LAST_PLAY_WEIGHT: 0.03,
  /** 経過日数の加点に対する上限日数(青天井にしない) */
  DAYS_SINCE_LAST_PLAY_CAP: 120,
  /** 応募実績が全くない/直近対局がない場合に日数加点の代わりに使う値 */
  NO_HISTORY_DAYS_EQUIVALENT: 120,
  /**
   * 参加率の信頼度を下げる基準応募回数。
   * これ未満の応募母数では参加率の影響を弱め、
   * 「応募1回・不参加だけで参加率0%」が過度に優遇されるのを防ぐ(仕様15章)。
   */
  CONFIDENCE_THRESHOLD_ENTRIES: 5,
} as const;

export type ParticipantStats = {
  userId: string;
  userName: string;
  /** 有効応募回数 = 過去エントリー数 - 本人キャンセル数 */
  validEntryCount: number;
  /** 実参加回数(played) */
  playedCount: number;
  /** 最終対局日。一度も対局していなければnull */
  lastPlayedAt: Date | null;
};

export type RecommendationResult = {
  userId: string;
  userName: string;
  score: number;
  isFirstTime: boolean;
  participationRate: number | null;
  daysSinceLastPlay: number | null;
  reasons: string[];
};

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * 1人分のレコメンドスコアを算出する。
 * スコアが高いほど「参加機会を広げる観点で推薦したい」度合いが高い。
 */
export function scoreParticipant(
  stats: ParticipantStats,
  now: Date = new Date()
): RecommendationResult {
  const w = RECOMMENDATION_WEIGHTS;
  const isFirstTime = stats.validEntryCount === 0 && stats.playedCount === 0;

  const participationRate =
    stats.validEntryCount > 0 ? stats.playedCount / stats.validEntryCount : null;

  const daysSinceLastPlay = stats.lastPlayedAt ? daysBetween(stats.lastPlayedAt, now) : null;

  let score = 0;
  const reasons: string[] = [];

  if (isFirstTime) {
    score += w.FIRST_TIME_BONUS;
    reasons.push("まだ対局記録がありません。初参加です");
  }

  if (participationRate !== null) {
    // 応募母数が少ないほど参加率の影響を弱める信頼度係数
    const confidence = Math.min(1, stats.validEntryCount / w.CONFIDENCE_THRESHOLD_ENTRIES);
    const rateScore = (1 - participationRate) * w.PARTICIPATION_RATE_WEIGHT * confidence;
    score += rateScore;
    if (participationRate < 0.5) {
      reasons.push(
        `過去${stats.validEntryCount}回の有効応募のうち${stats.playedCount}回参加`
      );
    }
  }

  if (daysSinceLastPlay !== null) {
    const cappedDays = Math.min(daysSinceLastPlay, w.DAYS_SINCE_LAST_PLAY_CAP);
    score += cappedDays * w.DAYS_SINCE_LAST_PLAY_WEIGHT;
    if (daysSinceLastPlay >= 30) {
      reasons.push(`最終対局は${daysSinceLastPlay}日前`);
    }
  } else if (!isFirstTime) {
    // 応募経験はあるが一度も対局していない
    score += w.NO_HISTORY_DAYS_EQUIVALENT * w.DAYS_SINCE_LAST_PLAY_WEIGHT;
    reasons.push("応募はしていますが、まだ対局参加の記録がありません");
  }

  if (reasons.length === 0) {
    reasons.push("最近も対局に参加しています");
  }

  return {
    userId: stats.userId,
    userName: stats.userName,
    score,
    isFirstTime,
    participationRate,
    daysSinceLastPlay,
    reasons,
  };
}

/**
 * 候補者からneededCount人を推薦する。
 * スコア降順でソートし、上位neededCount人をrecommendedとして返す。
 * 最終判断は募集者に委ねる(自由に変更可能)。
 */
export function recommendParticipants(
  candidates: ParticipantStats[],
  neededCount: number,
  now: Date = new Date()
): { recommended: RecommendationResult[]; others: RecommendationResult[] } {
  const scored = candidates
    .map((c) => scoreParticipant(c, now))
    .sort((a, b) => b.score - a.score);

  return {
    recommended: scored.slice(0, neededCount),
    others: scored.slice(neededCount),
  };
}

export type ParticipationStatusType = "first_time" | "low_recent" | "active";

export type ParticipationStatusMessage = {
  type: ParticipationStatusType;
  message: string;
};

/**
 * 募集詳細画面向け: 本人の参加状況メッセージ(仕様8章)。
 * 参加を抑制する文言は絶対に含めない。
 */
export function buildParticipationStatusMessage(
  stats: Pick<ParticipantStats, "validEntryCount" | "playedCount" | "lastPlayedAt">,
  now: Date = new Date()
): ParticipationStatusMessage {
  const isFirstTime = stats.validEntryCount === 0 && stats.playedCount === 0;
  if (isFirstTime) {
    return {
      type: "first_time",
      message: "まだ対局記録がありません。初参加歓迎です！ 🌱",
    };
  }

  const daysSinceLastPlay = stats.lastPlayedAt ? daysBetween(stats.lastPlayedAt, now) : null;
  const isLowRecent = daysSinceLastPlay === null || daysSinceLastPlay >= 30;

  if (isLowRecent) {
    return {
      type: "low_recent",
      message: "最近あまり対局していません。今回ぜひ参加してみませんか？ 🀄️",
    };
  }

  return {
    type: "active",
    message: "最近も麻雀に参加しています。今回ももちろん参加できます！",
  };
}
