import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuleSnapshot } from "@/lib/mahjong/scoreEngine";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GameResultBreakdown, type BreakdownRow } from "@/components/games/GameResultBreakdown";
import { GameScoreForm } from "@/components/games/GameScoreForm";
import {
  ConfirmGameButton,
  DiscardDraftButton,
  VoidGameButton,
} from "@/components/games/GameActionButtons";

const STATUS_LABEL = { draft: "下書き", confirmed: "確定済み", void: "無効" } as const;

export default async function GameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string; gameId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { groupId, gameId } = await params;
  const { edit } = await searchParams;
  const { user, membership } = await requireMembership(groupId);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { results: { include: { user: true } }, event: true },
  });
  if (!game || game.groupId !== groupId) notFound();

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

  const canManage = game.createdByUserId === user.id || membership.role === "owner";
  const backHref = game.eventId ? `/g/${groupId}/events/${game.eventId}` : `/g/${groupId}`;

  if (edit === "1" && game.status === "confirmed" && canManage) {
    return (
      <div className="space-y-4">
        <div>
          <Link href={`/g/${groupId}/games/${gameId}`} className="text-sm text-ink-400">
            ‹ 戻る
          </Link>
          <h1 className="font-serif mt-1 text-lg font-bold text-ink-900">結果を修正する</h1>
          <p className="mt-1 text-xs text-ink-400">
            この対局作成時点のルールで再計算されます(現在のルール変更の影響は受けません)。
          </p>
        </div>
        <GameScoreForm
          groupId={groupId}
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
        <Link href={backHref} className="text-sm text-ink-400">
          ‹ 戻る
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="font-serif text-lg font-bold text-ink-900">対局結果</h1>
          <Badge
            tone={game.status === "confirmed" ? "green" : game.status === "void" ? "neutral" : "gold"}
          >
            {STATUS_LABEL[game.status]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-ink-400">{formatDateTime(game.playedAt)}</p>
      </div>

      <GameResultBreakdown results={rows} chipEnabled={rule.chipEnabled} />

      {game.status === "draft" && (
        <div className="space-y-2">
          <ConfirmGameButton groupId={groupId} gameId={gameId} />
          <DiscardDraftButton groupId={groupId} gameId={gameId} />
        </div>
      )}

      {game.status === "confirmed" && canManage && (
        <div className="space-y-2 border-t border-ink-400/10 pt-4">
          <Link href={`/g/${groupId}/games/${gameId}?edit=1`} className="block">
            <Button variant="ghost" className="w-full">
              結果を修正する
            </Button>
          </Link>
          <VoidGameButton groupId={groupId} gameId={gameId} />
        </div>
      )}
    </div>
  );
}
