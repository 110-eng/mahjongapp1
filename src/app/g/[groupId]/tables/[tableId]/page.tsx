import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTableStandings, computeCumulativeSeries } from "@/lib/mahjong/tableStats";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CumulativeScoreChart } from "@/components/tables/CumulativeScoreChart";
import { TableLockButton } from "@/components/tables/TableLockButton";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; tableId: string }>;
}) {
  const { groupId, tableId } = await params;
  await requireMembership(groupId);

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      members: { include: { user: true }, orderBy: { seatOrder: "asc" } },
      games: { include: { results: true }, orderBy: { hanchanNumber: "asc" } },
    },
  });
  if (!table || table.groupId !== groupId) notFound();

  const members = table.members.map((m) => ({ userId: m.userId, userName: m.user.name }));
  const games = table.games.map((g) => ({
    id: g.id,
    hanchanNumber: g.hanchanNumber ?? 0,
    results: g.results.map((r) => ({ userId: r.userId, totalRankingPoint: r.totalRankingPoint })),
  }));

  const standings = computeTableStandings(members, games);
  const series = computeCumulativeSeries(members, games);
  const isOpen = table.status === "open";

  return (
    <div className="space-y-5">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-5 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={`/g/${groupId}/ranking?view=records`} className="text-xl leading-none">
            ‹
          </Link>
          <div className="text-center">
            <p className="font-serif text-base font-bold tracking-wide">
              {formatDate(table.playedDate)}の対局記録
            </p>
          </div>
          <Badge tone={isOpen ? "gold" : "neutral"}>{isOpen ? "記録中" : "ロック済み"}</Badge>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">面子と戦況</h2>
        <Card className="divide-y divide-ink-400/10">
          {standings.map((s) => (
            <div key={s.userId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-semibold text-ink-400">
                  {s.rank}
                </span>
                <span className="text-sm font-medium text-ink-900">{s.userName}</span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  s.total > 0 ? "text-board-800" : s.total < 0 ? "text-red-600" : "text-ink-600"
                }`}
              >
                {s.total > 0 ? "+" : ""}
                {s.total}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {isOpen && (
        <Link href={`/g/${groupId}/tables/${tableId}/members/new`} className="block">
          <Button variant="ghost" className="w-full">
            ＋ 面子を追加する
          </Button>
        </Link>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">成績表</h2>
        <Card className="p-4">
          <CumulativeScoreChart series={series} />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">半荘一覧</h2>
        <Card className="divide-y divide-ink-400/10">
          {table.games.length === 0 && (
            <p className="p-4 text-sm text-ink-400">まだ半荘の記録がありません。</p>
          )}
          {table.games.map((g, i) => {
            const top = [...g.results].sort((a, b) => a.rank - b.rank);
            return (
              <Link
                key={g.id}
                href={`/g/${groupId}/tables/${tableId}/hanchan/${g.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gold-500/5"
              >
                <span className="text-sm font-medium text-ink-900">半荘{i + 1}</span>
                <span className="text-xs text-ink-400">
                  {top
                    .map(
                      (r) =>
                        `${r.totalRankingPoint > 0 ? "+" : ""}${r.totalRankingPoint}`
                    )
                    .join(" / ")}
                </span>
              </Link>
            );
          })}
        </Card>
      </div>

      {isOpen && (
        <Link href={`/g/${groupId}/tables/${tableId}/hanchan/new`} className="block">
          <Button variant="secondary" className="w-full">
            ＋ 半荘を追加する
          </Button>
        </Link>
      )}

      {isOpen && (
        <div className="border-t border-ink-400/10 pt-4">
          <TableLockButton groupId={groupId} tableId={tableId} />
        </div>
      )}

      <Link href={`/g/${groupId}/ranking?view=records`} className="block">
        <Button variant="ghost" className="w-full">
          ‹ 一覧に戻る
        </Button>
      </Link>
    </div>
  );
}
