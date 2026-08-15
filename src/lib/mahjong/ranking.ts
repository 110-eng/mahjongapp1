/**
 * ランキング集計ロジック(仕様23〜24章)。
 *
 * 重要: 具体的な既存の点数計算・ranking_point算出ルールは本リポジトリ内に
 * 見つからなかったため、GameResult.rankingPointの値をそのまま期間集計する
 * 形にとどめ、算出ロジック自体は差し替え可能な構造にしている。
 * ranking_pointの計算方法自体はREADME.mdのTODOを参照。
 *
 * 参加者レコメンド(recommendation.ts)とは完全に分離しており、
 * このファイルの値をレコメンドロジックに使用してはならない(仕様26章)。
 */

/**
 * TODO(仮ルール): 1位/2位/3位/4位に応じたranking_point算出ルール(ウマ)。
 * 社内既存のランキング計算ルールが未確認のため、暫定的にウマのみのシンプルな
 * 配分(オカ・原点なし、合計0)を仮採用している。既存ルールが判明次第、
 * この配列(または算出関数)を差し替えること。詳細はREADME.mdのTODOを参照。
 */
export const PROVISIONAL_RANKING_POINT_BY_RANK: [number, number, number, number] = [
  30, 10, -10, -30,
];

export type GameResultLike = {
  userId: string;
  userName: string;
  rankingPoint: number;
  playedAt: Date;
};

export type RankingEntry = {
  rank: number;
  userId: string;
  userName: string;
  totalPoint: number;
  gamesPlayed: number;
};

/** 期間内のGameResultからランキングを集計する。集計ルール自体は差し替え可能。 */
export function calculateRanking(
  results: GameResultLike[],
  period: { start: Date; end: Date }
): RankingEntry[] {
  const inPeriod = results.filter(
    (r) => r.playedAt >= period.start && r.playedAt <= period.end
  );

  const byUser = new Map<string, { userName: string; totalPoint: number; gamesPlayed: number }>();
  for (const r of inPeriod) {
    const entry = byUser.get(r.userId) ?? {
      userName: r.userName,
      totalPoint: 0,
      gamesPlayed: 0,
    };
    entry.totalPoint += r.rankingPoint;
    entry.gamesPlayed += 1;
    byUser.set(r.userId, entry);
  }

  const sorted = Array.from(byUser.entries())
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.totalPoint - a.totalPoint);

  return sorted.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    userName: entry.userName,
    totalPoint: entry.totalPoint,
    gamesPlayed: entry.gamesPlayed,
  }));
}
