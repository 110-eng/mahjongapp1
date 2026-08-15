"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireOwner } from "@/lib/auth";

export async function createGroup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const seasonStartMonth = Number(formData.get("seasonStartMonth") ?? 9);
  if (!name || seasonStartMonth < 1 || seasonStartMonth > 12) {
    throw new Error("入力内容を確認してください");
  }

  const group = await prisma.group.create({
    data: {
      name,
      ownerUserId: user.id,
      seasonStartMonth,
      memberships: {
        create: { userId: user.id, role: "owner" },
      },
      rule: {
        create: {},
      },
    },
  });

  redirect(`/g/${group.id}`);
}

export async function joinGroupByToken(token: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await prisma.group.findUnique({ where: { inviteToken: token } });
  if (!group) return;

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    create: { groupId: group.id, userId: user.id, role: "member" },
    update: {},
  });

  redirect(`/g/${group.id}`);
}

export async function regenerateInviteToken(groupId: string) {
  await requireOwner(groupId);
  const { randomUUID } = await import("node:crypto");
  await prisma.group.update({
    where: { id: groupId },
    data: { inviteToken: randomUUID() },
  });
  revalidatePath(`/g/${groupId}/members`);
}
