import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddTableMemberForm } from "@/components/tables/AddTableMemberForm";
import { DecorativeDivider } from "@/components/ui/DecorativeDivider";

export default async function AddTableMemberPage({
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

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  const existingIds = new Set(table.members.map((m) => m.userId));
  const candidates = memberships
    .filter((m) => !m.user.isGuest && !existingIds.has(m.userId))
    .map((m) => ({ userId: m.userId, userName: m.user.name }));

  const addedMembers = table.members.map((m) => ({
    key: m.userId,
    label: m.user.isGuest ? `${m.user.name}(ゲスト)` : m.user.name,
  }));

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-6 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={`/g/${groupId}/tables/${tableId}`} className="text-xl leading-none">
            ‹
          </Link>
          <h1 className="font-serif text-base font-bold tracking-wide">面子の追加</h1>
          <span className="w-5" />
        </div>
        <DecorativeDivider className="mt-3" />
      </div>

      <AddTableMemberForm
        groupId={groupId}
        tableId={tableId}
        candidates={candidates}
        addedMembers={addedMembers}
      />
    </div>
  );
}
