import { Badge } from "@/components/ui/Badge";
import { TileRow } from "@/components/ui/TileRow";
import type { TableFormationResult } from "@/lib/mahjong/tableFormation";

/**
 * 卓成立の進捗表示。進行中(未成立/端数)は小さな緑ピル+補足テキスト、
 * 完全成立/超過時は下部に大きな祝祭メッセージとして表示する。
 */
export function TableFormationDisplay({
  entryCount,
  formation,
}: {
  entryCount: number;
  formation: TableFormationResult;
}) {
  const progressHeadline = formation.subMessage ? formation.headline : null;
  const celebrationHeadline = formation.subMessage ? null : formation.headline;

  return (
    <div className="space-y-2">
      {(progressHeadline || formation.subMessage) && (
        <div className="flex items-center justify-between gap-2">
          {progressHeadline ? <Badge tone="solidGreen">{progressHeadline}</Badge> : <span />}
          {formation.subMessage && (
            <span className="text-sm font-semibold text-ink-900">{formation.subMessage}</span>
          )}
        </div>
      )}

      <div className="flex items-end justify-between gap-2">
        <TileRow tiles={formation.tiles} />
        <span className="shrink-0 text-lg font-bold text-ink-900">
          {entryCount}
          <span className="text-sm font-normal text-ink-400">/{formation.capacity}人</span>
        </span>
      </div>

      {celebrationHeadline && (
        <p className="rounded-lg bg-red-500/10 py-1.5 text-center text-sm font-bold text-red-600">
          {celebrationHeadline}
        </p>
      )}
    </div>
  );
}
