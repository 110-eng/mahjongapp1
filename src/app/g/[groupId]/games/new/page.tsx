import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toRuleSnapshot } from "@/lib/mahjong/scoreEngine";
import { GameScoreForm } from "@/components/games/GameScoreForm";
import { DecorativeDivider } from "@/components/ui/DecorativeDivider";

export default async function NewGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { groupId } = await params;
  await requireMembership(groupId);
  const { eventId } = await searchParams;

  const rule = await prisma.groupRule.findUniqueOrThrow({ where: { groupId } });

  let candidates: { userId: string; userName: string }[];
  let backHref = `/g/${groupId}`;

  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { entries: { include: { user: true } } },
    });
    if (!event || event.groupId !== groupId) notFound();
    candidates = event.entries
      .filter((e) => ["entered", "selected", "played"].includes(e.status))
      .map((e) => ({ userId: e.userId, userName: e.user.name }));
    backHref = `/g/${groupId}/events/${eventId}`;
  } else {
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });
    candidates = memberships.map((m) => ({ userId: m.userId, userName: m.user.name }));
  }

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-6 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={backHref} className="text-xl leading-none">
            ‹
          </Link>
          <h1 className="font-serif text-base font-bold tracking-wide">対局を記録する</h1>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-washi-100 text-lg">
            🀄
          </span>
        </div>
        <DecorativeDivider className="mt-3" />
      </div>

      <GameScoreForm
        groupId={groupId}
        rule={toRuleSnapshot(rule)}
        mode="new"
        eventId={eventId ?? null}
        candidates={candidates}
      />
    </div>
  );
}
