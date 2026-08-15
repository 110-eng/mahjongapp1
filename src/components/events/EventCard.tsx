import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TileRow } from "@/components/ui/TileRow";
import { formatDateTime } from "@/lib/format";
import { getEntryPhase, ENTRY_PHASE_LABELS } from "@/lib/mahjong/eventStatus";
import type { TableFormationResult } from "@/lib/mahjong/tableFormation";
import type { Event, User } from "@/generated/prisma/client";

export function EventCard({
  event,
  organizer,
  entryCount,
  formation,
}: {
  event: Event;
  organizer: User;
  entryCount: number;
  formation: TableFormationResult;
}) {
  const phase = getEntryPhase(event.entryDeadline);

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card className="p-4 hover:border-gold-500/60 transition-colors">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={phase === "closing_soon" ? "red" : phase === "closed" ? "neutral" : "green"}>
            {ENTRY_PHASE_LABELS[phase]}
          </Badge>
          {event.beginnerFriendly && <Badge tone="gold">初心者歓迎</Badge>}
        </div>

        <h3 className="mt-2 text-base font-bold text-ink-900">{event.title}</h3>
        <dl className="mt-1 space-y-0.5 text-sm text-ink-600">
          <div className="flex gap-1">
            <dt className="w-16 shrink-0 text-ink-400">開催</dt>
            <dd>{formatDateTime(event.eventDatetime)}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="w-16 shrink-0 text-ink-400">募集者</dt>
            <dd>{organizer.name}</dd>
          </div>
        </dl>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-400">
              {entryCount} / {formation.capacity}人 ・ {formation.tablesFormed}卓成立
            </span>
          </div>
          <TileRow tiles={formation.tiles} />
          {(formation.headline || formation.subMessage) && (
            <p className="text-sm font-semibold text-board-800">
              {formation.headline}
              {formation.headline && formation.subMessage && " "}
              {formation.subMessage}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
