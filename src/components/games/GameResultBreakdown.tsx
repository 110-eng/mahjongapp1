import { Card } from "@/components/ui/Card";

export type BreakdownRow = {
  userId: string;
  userName: string;
  rank: number;
  finalScore: number;
  rawScorePoint: number;
  umaPoint: number;
  okaPoint: number;
  chipCount: number;
  chipPoint: number;
  penaltyPoint: number;
  totalRankingPoint: number;
};

const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);
const MEDAL = ["🥇", "🥈", "🥉", ""];

export function GameResultBreakdown({
  results,
  chipEnabled,
}: {
  results: BreakdownRow[];
  chipEnabled: boolean;
}) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <Card key={r.userId} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{MEDAL[r.rank - 1] || `${r.rank}位`}</span>
              <span className="text-sm font-semibold text-ink-900">{r.userName}</span>
            </div>
            <span
              className={`text-base font-bold ${
                r.totalRankingPoint > 0
                  ? "text-board-800"
                  : r.totalRankingPoint < 0
                    ? "text-red-600"
                    : "text-ink-600"
              }`}
            >
              {fmt(r.totalRankingPoint)}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">
            <div>
              <dt className="text-ink-400">最終点</dt>
              <dd className="font-medium text-ink-900">{r.finalScore.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-ink-400">素点</dt>
              <dd className="text-ink-600">{fmt(r.rawScorePoint)}</dd>
            </div>
            <div>
              <dt className="text-ink-400">ウマ</dt>
              <dd className="text-ink-600">{fmt(r.umaPoint)}</dd>
            </div>
            <div>
              <dt className="text-ink-400">オカ</dt>
              <dd className="text-ink-600">{fmt(r.okaPoint)}</dd>
            </div>
          </dl>
          {(chipEnabled || r.penaltyPoint !== 0) && (
            <div className="mt-1.5 flex justify-center gap-3 text-xs text-ink-400">
              {chipEnabled && (
                <span>
                  チップ {r.chipCount}枚 ({fmt(r.chipPoint)}pt)
                </span>
              )}
              {r.penaltyPoint !== 0 && (
                <span className="text-red-600">ペナルティ {fmt(r.penaltyPoint)}pt</span>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
