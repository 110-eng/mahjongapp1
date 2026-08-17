import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toRuleSnapshot } from "@/lib/mahjong/scoreEngine";
import { HanchanScoreForm } from "@/components/tables/HanchanScoreForm";
import { DecorativeDivider } from "@/components/ui/DecorativeDivider";

export default async function NewHanchanPage({
  params,
}: {
  params: Promise<{ groupId: string; tableId: string }>;
}) {
  const { groupId, tableId } = await params;
  await requireMembership(groupId);

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { members: { include: { user: true }, orderBy: { seatOrder: "asc" } } },
  });
  if (!table || table.groupId !== groupId) notFound();
  if (table.status !== "open") redirect(`/g/${groupId}/tables/${tableId}`);

  const rule = await prisma.groupRule.findUniqueOrThrow({ where: { groupId } });
  const roster = table.members.map((m) => ({ userId: m.userId, userName: m.user.name }));

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-6 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={`/g/${groupId}/tables/${tableId}`} className="text-xl leading-none">
            ‹
          </Link>
          <h1 className="font-serif text-base font-bold tracking-wide">半荘を追加する</h1>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-washi-100 text-lg">
            🀄
          </span>
        </div>
        <DecorativeDivider className="mt-3" />
      </div>

      <HanchanScoreForm
        groupId={groupId}
        tableId={tableId}
        rule={toRuleSnapshot(rule)}
        mode="new"
        roster={roster}
      />
    </div>
  );
}
