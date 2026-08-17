import { redirect } from "next/navigation";
import { getCurrentUser, listMyGroups } from "@/lib/auth";

/** ルートアクセス時に、ログイン状態と所属Groupに応じて適切な画面へ振り分ける */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await listMyGroups(user.id);
  if (memberships.length === 1) redirect(`/g/${memberships[0].groupId}`);
  redirect("/groups");
}
