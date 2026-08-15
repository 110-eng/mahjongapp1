import Link from "next/link";
import { getAllGameResults } from "@/lib/mahjong/queries";
import { calculateRanking } from "@/lib/mahjong/ranking";
import { getSeasonYear, getQuarterForDate, getSeasonRange, getQuarterRange, listQuarters, seasonLabel } from "@/lib/mahjong/season";
import { Card } from "@/components/ui/Card";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; quarter?: string }>;
}) {
  const { period, quarter } = await searchParams;
  const now = new Date();
  const seasonYear = getSeasonYear(now);
  const currentQuarter = getQuarterForDate(now).quarter;

  const mode = period === "season" ? "season" : "quarter";
  const selectedQuarter = (Number(quarter) >= 1 && Number(quarter) <= 4
    ? Number(quarter)
    : currentQuarter) as 1 | 2 | 3 | 4;

  const range = mode === "season" ? getSeasonRange(seasonYear) : getQuarterRange(seasonYear, selectedQuarter);
  const results = await getAllGameResults();
  const ranking = calculateRanking(results, range);
  const quarters = listQuarters(seasonYear);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-ink-900">ランキング</h1>

      <div className="flex gap-1 rounded-full bg-ink-400/10 p-1 text-sm font-medium">
        <Link
          href="/ranking?period=quarter"
          className={`flex-1 rounded-full py-2 text-center transition-colors ${
            mode === "quarter" ? "bg-washi-100 text-board-800 shadow-sm" : "text-ink-600"
          }`}
        >
          クォーター
        </Link>
        <Link
          href="/ranking?period=season"
          className={`flex-1 rounded-full py-2 text-center transition-colors ${
            mode === "season" ? "bg-washi-100 text-board-800 shadow-sm" : "text-ink-600"
          }`}
        >
          年間
        </Link>
      </div>

      {mode === "quarter" && (
        <div className="flex gap-2">
          {quarters.map((q) => (
            <Link
              key={q.quarter}
              href={`/ranking?period=quarter&quarter=${q.quarter}`}
              className={`flex-1 rounded-lg border py-1.5 text-center text-sm transition-colors ${
                selectedQuarter === q.quarter
                  ? "border-gold-500 bg-gold-500/10 font-semibold text-board-800"
                  : "border-ink-400/20 text-ink-600"
              }`}
            >
              Q{q.quarter}
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-400">
        {mode === "season" ? seasonLabel(seasonYear) : quarters[selectedQuarter - 1].label}
      </p>

      <Card className="divide-y divide-ink-400/10">
        {ranking.length === 0 && (
          <p className="p-4 text-sm text-ink-400">この期間の対局記録はまだありません。</p>
        )}
        {ranking.map((entry) => (
          <div key={entry.userId} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center text-lg">
                {MEDALS[entry.rank - 1] ?? entry.rank}
              </span>
              <span className="text-sm font-medium text-ink-900">{entry.userName}</span>
            </div>
            <span
              className={`text-sm font-semibold ${
                entry.totalPoint > 0
                  ? "text-board-800"
                  : entry.totalPoint < 0
                    ? "text-red-600"
                    : "text-ink-600"
              }`}
            >
              {entry.totalPoint > 0 ? "+" : ""}
              {entry.totalPoint}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
