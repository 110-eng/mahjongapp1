import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventDetail, summarizeEntries, getParticipantStats } from "@/lib/mahjong/queries";
import { computeTableFormation, needsParticipantSelection } from "@/lib/mahjong/tableFormation";
import { buildParticipationStatusMessage } from "@/lib/mahjong/recommendation";
import { getEntryPhase, ENTRY_PHASE_LABELS } from "@/lib/mahjong/eventStatus";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TileRow } from "@/components/ui/TileRow";
import { CopyRecruitmentButton } from "@/components/events/CopyRecruitmentButton";
import { EntryActionButton } from "@/components/events/EntryActionButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await getEventDetail(id);
  if (!event) notFound();

  const { entryCount, validEntries } = summarizeEntries(event.entries);
  const formation = computeTableFormation(entryCount, event.maxTables);
  const phase = getEntryPhase(event.entryDeadline);

  const myEntry = event.entries.find((e) => e.userId === user.id);
  const isEnteredNow = myEntry ? ["entered", "selected", "played"].includes(myEntry.status) : false;

  const stats = await getParticipantStats(user.id, event.id);
  const statusMessage = buildParticipationStatusMessage(stats);

  const isOrganizer = event.organizerUserId === user.id;
  const deadlinePassed = new Date() > event.entryDeadline;
  const requiresAdjustment = needsParticipantSelection(entryCount, event.maxTables);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={phase === "closing_soon" ? "red" : phase === "closed" ? "neutral" : "green"}>
          {ENTRY_PHASE_LABELS[phase]}
        </Badge>
        {event.beginnerFriendly && <Badge tone="gold">初心者歓迎</Badge>}
      </div>

      <div>
        <h1 className="text-xl font-bold text-ink-900">{event.title}</h1>
        <dl className="mt-2 space-y-1 text-sm text-ink-600">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">開催日時</dt>
            <dd>{formatDateTime(event.eventDatetime)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">エントリー締切</dt>
            <dd>{formatDateTime(event.entryDeadline)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">募集者</dt>
            <dd>{event.organizer.name}</dd>
          </div>
          {event.note && (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-ink-400">メモ</dt>
              <dd className="whitespace-pre-wrap">{event.note}</dd>
            </div>
          )}
        </dl>
      </div>

      <Card className="p-4 space-y-2">
        <span className="text-xs text-ink-400">
          {entryCount} / {formation.capacity}人 ・ {formation.tablesFormed}卓成立
        </span>
        <TileRow tiles={formation.tiles} />
        {(formation.headline || formation.subMessage) && (
          <p className="text-sm font-semibold text-board-800">
            {formation.headline}
            {formation.headline && formation.subMessage && " "}
            {formation.subMessage}
          </p>
        )}
      </Card>

      {!isEnteredNow && (
        <Card className="p-4 border-gold-500/50 bg-gold-500/5">
          <p className="text-sm text-ink-900">{statusMessage.message}</p>
        </Card>
      )}

      <div>
        {isEnteredNow ? (
          <EntryActionButton eventId={event.id} mode="cancel" disabled={myEntry?.status === "played"} />
        ) : (
          <EntryActionButton eventId={event.id} mode="enter" />
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">
          参加希望メンバー ({validEntries.length}人)
        </h2>
        <Card className="divide-y divide-ink-400/10">
          {validEntries.length === 0 && (
            <p className="p-4 text-sm text-ink-400">まだ参加希望がいません。</p>
          )}
          {validEntries.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-ink-900">{e.user.name}</span>
              {e.status === "selected" && <Badge tone="green">選定済み</Badge>}
              {e.status === "played" && <Badge tone="neutral">対局済み</Badge>}
            </div>
          ))}
        </Card>
      </div>

      {isOrganizer && (
        <div className="space-y-2 border-t border-ink-400/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            募集者向け操作
          </p>
          <CopyRecruitmentButton event={event} />
          {(formation.isOverCapacity || deadlinePassed || event.status !== "open") &&
            requiresAdjustment && (
            <Link href={`/events/${event.id}/adjust`} className="block">
              <Button variant="secondary" className="w-full">
                参加者を調整する
              </Button>
            </Link>
          )}
          {(event.status === "finalized" ||
            (event.status === "open" && !requiresAdjustment && entryCount > 0)) && (
            <Link href={`/events/${event.id}/game`} className="block">
              <Button variant="primary" className="w-full">
                対局結果を記録する
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
