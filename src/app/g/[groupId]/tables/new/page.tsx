import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTableForm } from "@/components/tables/NewTableForm";
import { DecorativeDivider } from "@/components/ui/DecorativeDivider";

export default async function NewTablePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  await requireMembership(groupId);

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  const candidates = memberships
    .filter((m) => !m.user.isGuest)
    .map((m) => ({ userId: m.userId, userName: m.user.name }));

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-6 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={`/g/${groupId}/ranking?view=records`} className="text-xl leading-none">
            ‹
          </Link>
          <h1 className="font-serif text-base font-bold tracking-wide">対局記録を作成する</h1>
          <span className="w-5" />
        </div>
        <DecorativeDivider className="mt-3" />
      </div>

      <NewTableForm groupId={groupId} candidates={candidates} />
    </div>
  );
}
