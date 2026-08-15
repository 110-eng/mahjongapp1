import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, PENDING_INVITE_COOKIE } from "@/lib/auth";
import { joinGroupByToken } from "@/app/groups/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    });
    redirect("/login");
  }

  const group = await prisma.group.findUnique({ where: { inviteToken: token } });

  if (!group) {
    return (
      <div className="min-h-dvh bg-board-900 flex items-center justify-center px-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-ink-600">
            この招待リンクは無効です。招待した人に最新のリンクを確認してください。
          </p>
        </Card>
      </div>
    );
  }

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  if (existing) {
    redirect(`/g/${group.id}`);
  }

  return (
    <div className="min-h-dvh bg-board-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 text-center space-y-4">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/60 bg-washi-100 text-2xl shadow-sm">
          🀄
        </span>
        <h1 className="font-serif text-lg font-bold text-ink-900">{group.name}に参加しますか？</h1>
        <p className="text-sm text-ink-600">
          参加すると、募集の閲覧・エントリー・ランキング確認ができるようになります。
        </p>
        <form action={joinGroupByToken.bind(null, token)}>
          <Button type="submit" variant="secondary" className="w-full">
            参加する
          </Button>
        </form>
      </Card>
    </div>
  );
}
