import { prisma } from "@/lib/prisma";
import { computeTableFormation } from "@/lib/mahjong/tableFormation";
import type { EntryStatus } from "@/generated/prisma/client";

/** 有効エントリー(参加希望として数える)状態。本人キャンセル/非選定は除外する */
export const VALID_ENTRY_STATUSES: EntryStatus[] = ["entered", "selected", "played"];

export function isValidEntry(status: EntryStatus): boolean {
  return VALID_ENTRY_STATUSES.includes(status);
}

export async function getEventDetail(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      entries: { include: { user: true }, orderBy: { enteredAt: "asc" } },
      games: { include: { results: true } },
    },
  });
  return event;
}

export function summarizeEntries<T extends { status: EntryStatus }>(entries: T[]) {
  const valid = entries.filter((e) => isValidEntry(e.status));
  return {
    entryCount: valid.length,
    validEntries: valid,
  };
}

export async function listOpenEvents() {
  const events = await prisma.event.findMany({
    where: { status: "open" },
    include: { organizer: true, entries: true },
    orderBy: { eventDatetime: "asc" },
  });

  return events.map((event) => {
    const { entryCount } = summarizeEntries(event.entries);
    return {
      event,
      entryCount,
      formation: computeTableFormation(entryCount, event.maxTables),
    };
  });
}

export async function listMyEvents(userId: string) {
  const entries = await prisma.entry.findMany({
    where: { userId, status: { in: VALID_ENTRY_STATUSES } },
    include: {
      event: { include: { organizer: true, entries: true } },
    },
    orderBy: { event: { eventDatetime: "desc" } },
  });

  return entries.map(({ event, status }) => {
    const { entryCount } = summarizeEntries(event.entries);
    return {
      event,
      myStatus: status,
      entryCount,
      formation: computeTableFormation(entryCount, event.maxTables),
    };
  });
}

/** ランキング集計用に全対局結果を取得する(仕様23章) */
export async function getAllGameResults() {
  const results = await prisma.gameResult.findMany({
    include: { user: true, game: true },
  });
  return results.map((r) => ({
    userId: r.userId,
    userName: r.user.name,
    rankingPoint: r.rankingPoint,
    playedAt: r.game.playedAt,
  }));
}

/**
 * ある1名の参加機会レコメンド用の統計を計算する(仕様14章)。
 * eventIdを指定した場合、そのイベント自身のエントリーは除外して算出する
 * (これから参加を検討している募集自体をカウントしないため)。
 */
export async function getParticipantStats(userId: string, excludeEventId?: string) {
  const entries = await prisma.entry.findMany({
    where: { userId, ...(excludeEventId ? { eventId: { not: excludeEventId } } : {}) },
  });

  const validEntryCount = entries.filter((e) => e.status !== "cancelled").length;
  const playedEntries = entries.filter((e) => e.status === "played" && e.playedAt);
  const playedCount = playedEntries.length;
  const lastPlayedAt = playedEntries.reduce<Date | null>((latest, e) => {
    if (!e.playedAt) return latest;
    if (!latest || e.playedAt > latest) return e.playedAt;
    return latest;
  }, null);

  return { validEntryCount, playedCount, lastPlayedAt };
}
