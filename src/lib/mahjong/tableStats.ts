/**
 * 対局記録(Table)内の複数半荘をまとめて集計する純粋関数群。
 * スコア計算そのものはscoreEngine.tsのcalculateGameResultsに任せ、
 * ここでは半荘をまたいだ累計・順位付けのみを扱う。
 */

export type TableMemberLike = { userId: string; userName: string };

export type TableHanchanLike = {
  hanchanNumber: number;
  results: { userId: string; totalRankingPoint: number }[];
};

export type TableStanding = {
  userId: string;
  userName: string;
  total: number;
  gamesPlayed: number;
  rank: number;
};

/** 面子と戦況: ロスター全員の現時点での累計ポイントを降順ランキングで返す */
export function computeTableStandings(
  members: TableMemberLike[],
  games: TableHanchanLike[]
): TableStanding[] {
  const totals = new Map<string, number>();
  const gamesPlayed = new Map<string, number>();
  for (const m of members) {
    totals.set(m.userId, 0);
    gamesPlayed.set(m.userId, 0);
  }

  for (const game of games) {
    for (const r of game.results) {
      totals.set(r.userId, (totals.get(r.userId) ?? 0) + r.totalRankingPoint);
      gamesPlayed.set(r.userId, (gamesPlayed.get(r.userId) ?? 0) + 1);
    }
  }

  const rounded = members.map((m) => ({
    userId: m.userId,
    userName: m.userName,
    total: Math.round((totals.get(m.userId) ?? 0) * 10) / 10,
    gamesPlayed: gamesPlayed.get(m.userId) ?? 0,
  }));

  rounded.sort((a, b) => b.total - a.total);

  return rounded.map((r, i) => ({ ...r, rank: i + 1 }));
}

export type CumulativeSeriesPoint = {
  /** 表示用の半荘ラベル(1始まり、削除があっても欠番なく連番になる) */
  hanchanLabel: number;
  totals: Record<string, number>;
};

export type CumulativeSeries = {
  players: TableMemberLike[];
  points: CumulativeSeriesPoint[];
};

/**
 * 成績表(累計折れ線グラフ)用のデータを組み立てる。
 * ある半荘を欠席したメンバーは、直前の累計値を横ばいで維持する。
 */
export function computeCumulativeSeries(
  members: TableMemberLike[],
  games: TableHanchanLike[]
): CumulativeSeries {
  const ordered = [...games].sort((a, b) => a.hanchanNumber - b.hanchanNumber);
  const running = new Map<string, number>(members.map((m) => [m.userId, 0]));

  const points: CumulativeSeriesPoint[] = ordered.map((game, i) => {
    for (const r of game.results) {
      running.set(r.userId, (running.get(r.userId) ?? 0) + r.totalRankingPoint);
    }
    return {
      hanchanLabel: i + 1,
      totals: Object.fromEntries(
        members.map((m) => [m.userId, Math.round((running.get(m.userId) ?? 0) * 10) / 10])
      ),
    };
  });

  return { players: members, points };
}
