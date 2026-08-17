import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuleSnapshot } from "@/lib/mahjong/scoreEngine";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { GameResultBreakdown, type BreakdownRow } from "@/components/games/GameResultBreakdown";
import { HanchanScoreForm } from "@/components/tables/HanchanScoreForm";
import { DeleteHanchanButton } from "@/components/tables/HanchanActionButtons";

export default async function HanchanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string; tableId: string; gameId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { groupId, tableId, gameId } = await params;
  const { edit } = await searchParams;
  await requireMembership(groupId);

  const [game, table] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      include: { results: { include: { user: true } } },
    }),
    prisma.table.findUnique({ where: { id: tableId } }),
  ]);
  if (!game || game.groupId !== groupId || game.tableId !== tableId) notFound();
  if (!table || table.groupId !== groupId) notFound();

  const rule = parseRuleSnapshot(game.ruleSnapshot);
  const rows: BreakdownRow[] = game.results.map((r) => ({
    userId: r.userId,
    userName: r.user.name,
    rank: r.rank,
    finalScore: r.finalScore,
    rawScorePoint: r.rawScorePoint,
    umaPoint: r.umaPoint,
    okaPoint: r.okaPoint,
    chipCount: r.chipCount,
    chipPoint: r.chipPoint,
    penaltyPoint: r.penaltyPoint,
    totalRankingPoint: r.totalRankingPoint,
  }));

  const isOpen = table.status === "open";

  if (edit === "1" && isOpen) {
    return (
      <div className="space-y-4">
        <div>
          <Link href={`/g/${groupId}/tables/${tableId}/hanchan/${gameId}`} className="text-sm text-ink-400">
            ‹ 戻る
          </Link>
          <h1 className="font-serif mt-1 text-lg font-bold text-ink-900">半荘の結果を修正する</h1>
        </div>
        <HanchanScoreForm
          groupId={groupId}
          tableId={tableId}
          rule={rule}
          mode="edit"
          gameId={gameId}
          fixedPlayers={rows
            .sort((a, b) => a.rank - b.rank)
            .map((r) => ({
              userId: r.userId,
              userName: r.userName,
              finalScore: r.finalScore,
              chipCount: r.chipCount,
            }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/g/${groupId}/tables/${tableId}`} className="text-sm text-ink-400">
          ‹ 戻る
        </Link>
        <h1 className="font-serif mt-1 text-lg font-bold text-ink-900">半荘の結果</h1>
        <p className="mt-1 text-xs text-ink-400">{formatDateTime(game.playedAt)}</p>
      </div>

      <GameResultBreakdown results={rows} chipEnabled={rule.chipEnabled} />

      {isOpen && (
        <div className="space-y-2 border-t border-ink-400/10 pt-4">
          <Link href={`/g/${groupId}/tables/${tableId}/hanchan/${gameId}?edit=1`} className="block">
            <Button variant="ghost" className="w-full">
              結果を修正する
            </Button>
          </Link>
          <DeleteHanchanButton groupId={groupId} tableId={tableId} gameId={gameId} />
        </div>
      )}
    </div>
  );
}
