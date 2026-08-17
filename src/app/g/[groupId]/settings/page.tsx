import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { GroupRuleForm } from "@/components/groups/GroupRuleForm";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  await requireOwner(groupId);

  const rule = await prisma.groupRule.findUnique({ where: { groupId } });
  if (!rule) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-lg font-bold text-ink-900">麻雀ルール設定</h1>
        <p className="mt-1 text-sm text-ink-600">
          ここで設定した内容は、以後に作成される対局にのみ適用されます。過去の対局結果は変わりません。
        </p>
      </div>

      <Card className="p-4">
        <GroupRuleForm groupId={groupId} rule={rule} />
      </Card>
    </div>
  );
}
