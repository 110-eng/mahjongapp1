"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/auth";

export async function enterEvent(groupId: string, eventId: string) {
  const { user } = await requireMembership(groupId);

  await prisma.entry.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    create: { eventId, userId: user.id, status: "entered" },
    update: { status: "entered", enteredAt: new Date(), cancelledAt: null },
  });

  revalidatePath(`/g/${groupId}/events/${eventId}`);
  revalidatePath(`/g/${groupId}`);
}

export async function cancelEntry(groupId: string, eventId: string) {
  const { user } = await requireMembership(groupId);

  await prisma.entry.update({
    where: { eventId_userId: { eventId, userId: user.id } },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath(`/g/${groupId}/events/${eventId}`);
  revalidatePath(`/g/${groupId}`);
}

/** 端数のまま締切を延長する(仕様11章: 募集を延長する) */
export async function extendDeadline(groupId: string, eventId: string, newDeadline: string) {
  await requireMembership(groupId);
  await prisma.event.update({
    where: { id: eventId },
    data: { entryDeadline: new Date(newDeadline) },
  });
  revalidatePath(`/g/${groupId}/events/${eventId}`);
  revalidatePath(`/g/${groupId}`);
}

/**
 * 参加者を確定する(仕様13章)。
 * 最終判断は募集者が行うため、selectedUserIdsは募集者がフォームで
 * 自由に変更した結果をそのまま受け取る。
 */
export async function finalizeParticipants(
  groupId: string,
  eventId: string,
  selectedUserIds: string[]
) {
  await requireMembership(groupId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { entries: true },
  });
  if (!event || event.groupId !== groupId) return;

  const validEntries = event.entries.filter((e) =>
    ["entered", "selected", "played"].includes(e.status)
  );

  await Promise.all(
    validEntries.map((entry) => {
      const selected = selectedUserIds.includes(entry.userId);
      return prisma.entry.update({
        where: { id: entry.id },
        data: selected
          ? { status: "selected", selectedAt: new Date() }
          : { status: "not_selected" },
      });
    })
  );

  await prisma.event.update({ where: { id: eventId }, data: { status: "finalized" } });

  revalidatePath(`/g/${groupId}/events/${eventId}`);
  revalidatePath(`/g/${groupId}`);
}
