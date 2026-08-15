"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { PROVISIONAL_RANKING_POINT_BY_RANK } from "@/lib/mahjong/ranking";

export async function enterEvent(eventId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await prisma.entry.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status: "entered" },
    update: { status: "entered", enteredAt: new Date(), cancelledAt: null },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

export async function cancelEntry(eventId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await prisma.entry.update({
    where: { eventId_userId: { eventId, userId } },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

/** 端数のまま締切を延長する(仕様11章: 募集を延長する) */
export async function extendDeadline(eventId: string, newDeadline: string) {
  await prisma.event.update({
    where: { id: eventId },
    data: { entryDeadline: new Date(newDeadline) },
  });
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

/**
 * 参加者を確定する(仕様13章)。
 * 最終判断は募集者が行うため、selectedUserIdsは募集者がフォームで
 * 自由に変更した結果をそのまま受け取る。
 */
export async function finalizeParticipants(eventId: string, selectedUserIds: string[]) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { entries: true },
  });
  if (!event) return;

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

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

/**
 * 1卓分の対局結果を記録する(仕様17章)。
 * 点数の降順でrankを算出し、rankingPointは仮ルール(PROVISIONAL_RANKING_POINT_BY_RANK)で算出する。
 * 対象のEntryはplayedとして記録され、参加履歴・レコメンドに反映される。
 */
export async function recordGameResult(
  eventId: string,
  players: { entryId: string; userId: string; score: number }[]
) {
  if (players.length !== 4) throw new Error("4人分の結果が必要です");

  const playedAt = new Date();
  const ranked = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1, rankingPoint: PROVISIONAL_RANKING_POINT_BY_RANK[i] }));

  const game = await prisma.game.create({ data: { eventId, playedAt } });

  await Promise.all(
    ranked.map((p) =>
      Promise.all([
        prisma.gameResult.create({
          data: {
            gameId: game.id,
            userId: p.userId,
            rank: p.rank,
            score: p.score,
            rankingPoint: p.rankingPoint,
          },
        }),
        prisma.entry.update({
          where: { id: p.entryId },
          data: { status: "played", playedAt },
        }),
      ])
    )
  );

  const remaining = await prisma.entry.count({
    where: { eventId, status: { in: ["entered", "selected"] } },
  });

  if (remaining === 0) {
    await prisma.event.update({ where: { id: eventId }, data: { status: "completed" } });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/mypage");
  revalidatePath("/ranking");
}
