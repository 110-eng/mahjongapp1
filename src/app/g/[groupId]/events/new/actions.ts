"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/auth";

export async function createEvent(groupId: string, formData: FormData) {
  const { user } = await requireMembership(groupId);

  const title = String(formData.get("title") ?? "").trim();
  const eventDatetime = String(formData.get("eventDatetime") ?? "");
  const entryDeadline = String(formData.get("entryDeadline") ?? "");
  const maxTables = Number(formData.get("maxTables") ?? 1);
  const beginnerFriendly = formData.get("beginnerFriendly") === "on";
  const note = String(formData.get("note") ?? "").trim();

  if (!title || !eventDatetime || !entryDeadline || !maxTables || maxTables < 1) {
    throw new Error("入力内容を確認してください");
  }

  const event = await prisma.event.create({
    data: {
      groupId,
      title,
      organizerUserId: user.id,
      eventDatetime: new Date(eventDatetime),
      entryDeadline: new Date(entryDeadline),
      maxTables,
      beginnerFriendly,
      note: note || null,
      status: "open",
    },
  });

  redirect(`/g/${groupId}/events/${event.id}`);
}
