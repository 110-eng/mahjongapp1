import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { getEventDetail, summarizeEntries, getParticipantStats } from "@/lib/mahjong/queries";
import { computeTableFormation, needsParticipantSelection } from "@/lib/mahjong/tableFormation";
import { recommendParticipants, type ParticipantStats } from "@/lib/mahjong/recommendation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableFormationDisplay } from "@/components/events/TableFormationDisplay";
import { FinalizeForm } from "@/components/events/FinalizeForm";
import { ExtendDeadlineForm } from "@/components/events/ExtendDeadlineForm";

export default async function AdjustEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string; id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { groupId, id } = await params;
  const { mode } = await searchParams;
  const { user } = await requireMembership(groupId);

  const event = await getEventDetail(groupId, id);
  if (!event) notFound();
  if (event.organizerUserId !== user.id) redirect(`/g/${groupId}/events/${id}`);

  const { entryCount, validEntries } = summarizeEntries(event.entries);
  const formation = computeTableFormation(entryCount, event.maxTables);
  const needsSelection = needsParticipantSelection(entryCount, event.maxTables);

  if (!needsSelection) {
    redirect(`/g/${groupId}/events/${id}`);
  }

  const showFinalizeStep = formation.isOverCapacity || mode === "finalize";

  if (!showFinalizeStep) {
    // 端数のケース: 1卓で確定する/延長する/追加募集を続ける の3択
    return (
      <div className="space-y-5">
        <h1 className="font-serif text-lg font-bold text-ink-900">参加者の調整</h1>

        <Card className="p-4">
          <TableFormationDisplay entryCount={entryCount} formation={formation} />
        </Card>

        <p className="text-sm text-ink-600">
          エントリー締切の時点で人数が4の倍数に達していません。どうしますか？
        </p>

        <div className="space-y-3">
          <Link href={`/g/${groupId}/events/${id}/adjust?mode=finalize`} className="block">
            <Button variant="secondary" className="w-full">
              {Math.floor(entryCount / 4) * 4}人で1卓確定する
            </Button>
          </Link>

          <ExtendDeadlineForm groupId={groupId} eventId={id} />

          <Link href={`/g/${groupId}/events/${id}`} className="block">
            <Button variant="ghost" className="w-full">
              このまま追加募集を続ける
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 超過 or 「1卓で確定する」選択後: 参加候補レコメンドを表示
  const neededCount = formation.isOverCapacity
    ? formation.capacity
    : Math.floor(entryCount / 4) * 4;

  const candidateStats: (ParticipantStats & { entryId: string })[] = await Promise.all(
    validEntries.map(async (entry) => {
      const stats = await getParticipantStats(entry.userId, groupId, event.id);
      return {
        userId: entry.userId,
        userName: entry.user.name,
        entryId: entry.id,
        ...stats,
      };
    })
  );

  const { recommended, others } = recommendParticipants(candidateStats, neededCount);

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-lg font-bold text-ink-900">参加者を確定する</h1>
      <p className="text-sm text-ink-600">
        {formation.isOverCapacity
          ? `定員(${formation.capacity}人)を超える応募がありました。参加機会の観点でおすすめのメンバーを表示しています。`
          : "参加機会の観点でおすすめのメンバーを表示しています。"}
        最終判断は募集者にお任せします。
      </p>
      <FinalizeForm
        groupId={groupId}
        eventId={id}
        neededCount={neededCount}
        recommended={recommended}
        others={others}
      />
    </div>
  );
}
