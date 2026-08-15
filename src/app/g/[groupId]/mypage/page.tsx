import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getParticipantStats,
  getConfirmedGameResults,
  getPersonalGameStats,
} from "@/lib/mahjong/queries";
import { calculateRanking } from "@/lib/mahjong/ranking";
import { getSeasonYear, getQuarterForDate, getSeasonRange, getQuarterRange } from "@/lib/mahjong/season";
import { EXPERIENCE_LABELS } from "@/lib/mahjong/experience";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export default async function MyPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { user } = await requireMembership(groupId);
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

  const stats = await getParticipantStats(user.id, groupId);
  const participationRate =
    stats.validEntryCount > 0 ? stats.playedCount / stats.validEntryCount : null;

  const now = new Date();
  const seasonYear = getSeasonYear(now, group.seasonStartMonth);
  const currentQuarter = getQuarterForDate(now, group.seasonStartMonth).quarter;
  const seasonRange = getSeasonRange(seasonYear, group.seasonStartMonth);
  const quarterRange = getQuarterRange(seasonYear, currentQuarter, group.seasonStartMonth);

  const results = await getConfirmedGameResults(groupId);
  const seasonRanking = calculateRanking(results, seasonRange);
  const quarterRanking = calculateRanking(results, quarterRange);

  const seasonEntry = seasonRanking.find((r) => r.userId === user.id);
  const quarterEntry = quarterRanking.find((r) => r.userId === user.id);

  const seasonPersonal = await getPersonalGameStats(groupId, user.id, seasonRange);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl font-bold text-ink-900">{user.name}</h1>
        <p className="mt-0.5 text-sm text-ink-600">{EXPERIENCE_LABELS[user.experienceLevel]}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">参加状況</h2>
        <Card className="divide-y divide-ink-400/10">
          <Row label="有効応募回数" value={`${stats.validEntryCount}回`} />
          <Row label="実参加回数" value={`${stats.playedCount}回`} />
          <Row
            label="参加率"
            value={participationRate === null ? "-" : `${Math.round(participationRate * 100)}%`}
          />
          <Row
            label="最終対局日"
            value={stats.lastPlayedAt ? formatDate(stats.lastPlayedAt) : "まだありません"}
          />
        </Card>
        <p className="mt-1.5 text-xs text-ink-400">
          参加率は参加機会の目安であり、麻雀の強さとは関係ありません。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">ランキング</h2>
        <Card className="divide-y divide-ink-400/10">
          <Row
            label="年間順位"
            value={
              seasonEntry
                ? `${seasonEntry.rank}位 (${seasonEntry.totalPoint > 0 ? "+" : ""}${seasonEntry.totalPoint})`
                : "記録なし"
            }
          />
          <Row
            label={`現在Q${currentQuarter}順位`}
            value={
              quarterEntry
                ? `${quarterEntry.rank}位 (${quarterEntry.totalPoint > 0 ? "+" : ""}${quarterEntry.totalPoint})`
                : "記録なし"
            }
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">今シーズンの成績</h2>
        <Card className="divide-y divide-ink-400/10">
          <Row label="対局数" value={`${seasonPersonal.gamesPlayed}回`} />
          <Row label="1位回数" value={`${seasonPersonal.firstPlaceCount}回`} />
          <Row
            label="平均順位"
            value={
              seasonPersonal.averageRank === null
                ? "-"
                : `${seasonPersonal.averageRank.toFixed(2)}位`
            }
          />
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
