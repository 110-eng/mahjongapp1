import type { CumulativeSeries } from "@/lib/mahjong/tableStats";

const LINE_COLORS = [
  "stroke-board-700",
  "stroke-gold-500",
  "stroke-red-500",
  "stroke-ink-600",
  "stroke-board-900",
  "stroke-gold-600",
];
const DOT_FILLS = [
  "fill-board-700",
  "fill-gold-500",
  "fill-red-500",
  "fill-ink-600",
  "fill-board-900",
  "fill-gold-600",
];
const LEGEND_DOTS = [
  "bg-board-700",
  "bg-gold-500",
  "bg-red-500",
  "bg-ink-600",
  "bg-board-900",
  "bg-gold-600",
];

/** 成績表: 半荘をまたいだ累計ポイントの折れ線グラフ(追加ライブラリなしの手書きSVG) */
export function CumulativeScoreChart({ series }: { series: CumulativeSeries }) {
  const { players, points } = series;

  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">まだ半荘の記録がありません。</p>;
  }

  const width = 320;
  const height = 160;
  const paddingX = 10;
  const paddingY = 16;

  const allValues = points.flatMap((p) => players.map((m) => p.totals[m.userId] ?? 0));
  const maxVal = Math.max(0, ...allValues);
  const minVal = Math.min(0, ...allValues);
  const range = maxVal - minVal || 1;

  const xForIndex = (i: number) =>
    points.length === 1 ? width / 2 : paddingX + (i / (points.length - 1)) * (width - paddingX * 2);
  const yForValue = (v: number) =>
    height - paddingY - ((v - minVal) / range) * (height - paddingY * 2);

  const zeroY = yForValue(0);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 280 }}>
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            className="stroke-ink-400/30"
            strokeWidth={1}
          />
          {players.map((m, pi) => {
            const path = points
              .map(
                (pt, i) => `${i === 0 ? "M" : "L"} ${xForIndex(i)} ${yForValue(pt.totals[m.userId] ?? 0)}`
              )
              .join(" ");
            return (
              <g key={m.userId}>
                <path
                  d={path}
                  fill="none"
                  strokeWidth={2}
                  className={LINE_COLORS[pi % LINE_COLORS.length]}
                />
                {points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={xForIndex(i)}
                    cy={yForValue(pt.totals[m.userId] ?? 0)}
                    r={2.5}
                    className={DOT_FILLS[pi % DOT_FILLS.length]}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-600">
        {players.map((m, pi) => (
          <span key={m.userId} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${LEGEND_DOTS[pi % LEGEND_DOTS.length]}`} />
            {m.userName}
          </span>
        ))}
      </div>
    </div>
  );
}
