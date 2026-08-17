"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/auth";
import {
  calculateGameResults,
  toRuleSnapshot,
  parseRuleSnapshot,
  type PlayerInput,
} from "@/lib/mahjong/scoreEngine";

type PlayerFormInput = { userId: string; finalScore: number; chipCount: number };

function toGameResultRows(results: ReturnType<typeof calculateGameResults>) {
  return results.map((r) => ({
    userId: r.userId,
    seatOrder: r.seatOrder,
    finalScore: r.finalScore,
    rank: r.rank,
    rawScorePoint: r.rawScorePoint,
    umaPoint: r.umaPoint,
    okaPoint: r.okaPoint,
    chipCount: r.chipCount,
    chipPoint: r.chipPoint,
    penaltyPoint: r.penaltyPoint,
    totalRankingPoint: r.totalRankingPoint,
  }));
}

/** 対局記録が編集可能(open状態かつ権限あり)であることを検証し、Table/GroupRuleを返す */
async function requireTableEditable(groupId: string, tableId: string, membershipRole: string) {
  const [table, groupRule] = await Promise.all([
    prisma.table.findUnique({ where: { id: tableId } }),
    prisma.groupRule.findUniqueOrThrow({ where: { groupId } }),
  ]);
  if (!table || table.groupId !== groupId) throw new Error("対局記録が見つかりません");
  if (table.status !== "open") throw new Error("この対局記録はロック済みのため操作できません");
  if (groupRule.resultEntryPermission === "owner_only" && membershipRole !== "owner") {
    throw new Error("この麻雀部では管理者のみが対局記録を編集できます");
  }
  return { table, groupRule };
}

/**
 * 対局記録(Table)を新規作成する。面子(ロスター)は最初に選んだメンバー+ゲストで初期化する。
 * ゲストはこの時点で軽量Userレコード(isGuest=true)として作成する。
 */
export async function createTable(
  groupId: string,
  playedDateISO: string,
  memberUserIds: string[],
  guestNames: string[] = []
) {
  const { user, membership } = await requireMembership(groupId);
  const groupRule = await prisma.groupRule.findUniqueOrThrow({ where: { groupId } });
  if (groupRule.resultEntryPermission === "owner_only" && membership.role !== "owner") {
    throw new Error("この麻雀部では管理者のみが対局記録を作成できます");
  }

  const guestUsers = await Promise.all(
    guestNames
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => prisma.user.create({ data: { name, isGuest: true } }))
  );
  const allMemberIds = [...memberUserIds, ...guestUsers.map((g) => g.id)];
  if (allMemberIds.length === 0) throw new Error("面子を1人以上選んでください");

  const table = await prisma.table.create({
    data: {
      groupId,
      playedDate: new Date(playedDateISO),
      createdByUserId: user.id,
      members: { create: allMemberIds.map((userId, i) => ({ userId, seatOrder: i })) },
    },
  });

  revalidatePath(`/g/${groupId}/ranking`);
  redirect(`/g/${groupId}/tables/${table.id}`);
}

/** 既存メンバーを対局記録の面子(ロスター)に追加する */
export async function addExistingMember(groupId: string, tableId: string, userId: string) {
  const { membership } = await requireMembership(groupId);
  await requireTableEditable(groupId, tableId, membership.role);

  const existing = await prisma.tableMember.findUnique({
    where: { tableId_userId: { tableId, userId } },
  });
  if (!existing) {
    const seatOrder = await prisma.tableMember.count({ where: { tableId } });
    await prisma.tableMember.create({ data: { tableId, userId, seatOrder } });
  }

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  redirect(`/g/${groupId}/tables/${tableId}`);
}

/** その場限りのゲスト参加者を作成し、面子(ロスター)に追加する。ランキング集計対象外(isGuest=true)。 */
export async function addGuestMember(groupId: string, tableId: string, guestName: string) {
  const { membership } = await requireMembership(groupId);
  await requireTableEditable(groupId, tableId, membership.role);

  const trimmed = guestName.trim();
  if (!trimmed) throw new Error("ゲスト名を入力してください");

  const guest = await prisma.user.create({ data: { name: trimmed, isGuest: true } });
  const seatOrder = await prisma.tableMember.count({ where: { tableId } });
  await prisma.tableMember.create({ data: { tableId, userId: guest.id, seatOrder } });

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  redirect(`/g/${groupId}/tables/${tableId}`);
}

/** 半荘を1件追加する。ロスターから選んだ4人の最終持ち点から自動計算する。 */
export async function createHanchan(groupId: string, tableId: string, players: PlayerFormInput[]) {
  const { user, membership } = await requireMembership(groupId);
  if (players.length !== 4) throw new Error("4人分の入力が必要です");
  const { groupRule } = await requireTableEditable(groupId, tableId, membership.role);

  const ruleSnapshot = toRuleSnapshot(groupRule);
  const inputs: PlayerInput[] = players.map((p, i) => ({
    userId: p.userId,
    seatOrder: i,
    finalScore: p.finalScore,
    chipCount: p.chipCount,
  }));
  const results = calculateGameResults(inputs, ruleSnapshot);

  const lastHanchan = await prisma.game.findFirst({
    where: { tableId },
    orderBy: { hanchanNumber: "desc" },
  });
  const hanchanNumber = (lastHanchan?.hanchanNumber ?? 0) + 1;

  const game = await prisma.game.create({
    data: {
      groupId,
      tableId,
      hanchanNumber,
      ruleSnapshot: JSON.stringify(ruleSnapshot),
      status: "confirmed",
      createdByUserId: user.id,
      results: { create: toGameResultRows(results) },
    },
  });

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  redirect(`/g/${groupId}/tables/${tableId}/hanchan/${game.id}`);
}

/** 半荘の素点/チップを修正する。参加した4人自体は変更できない(既存の記録に固定)。 */
export async function updateHanchan(
  groupId: string,
  tableId: string,
  gameId: string,
  players: PlayerFormInput[]
) {
  const { membership } = await requireMembership(groupId);
  if (players.length !== 4) throw new Error("4人分の入力が必要です");
  await requireTableEditable(groupId, tableId, membership.role);

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.tableId !== tableId) throw new Error("半荘が見つかりません");

  const ruleSnapshot = parseRuleSnapshot(game.ruleSnapshot);
  const inputs: PlayerInput[] = players.map((p, i) => ({
    userId: p.userId,
    seatOrder: i,
    finalScore: p.finalScore,
    chipCount: p.chipCount,
  }));
  const results = calculateGameResults(inputs, ruleSnapshot);

  await prisma.gameResult.deleteMany({ where: { gameId } });
  await prisma.gameResult.createMany({
    data: toGameResultRows(results).map((r) => ({ ...r, gameId })),
  });

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  redirect(`/g/${groupId}/tables/${tableId}/hanchan/${gameId}`);
}

/** 半荘を1件削除する。記録した本人か管理者のみ実行できる。 */
export async function deleteHanchan(groupId: string, tableId: string, gameId: string) {
  const { user, membership } = await requireMembership(groupId);
  await requireTableEditable(groupId, tableId, membership.role);

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.tableId !== tableId) return;
  if (game.createdByUserId !== user.id && membership.role !== "owner") {
    throw new Error("この半荘を削除できるのは記録した本人か管理者のみです");
  }

  await prisma.gameResult.deleteMany({ where: { gameId } });
  await prisma.game.delete({ where: { id: gameId } });

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  redirect(`/g/${groupId}/tables/${tableId}`);
}

/** 対局記録をロックする(不可逆)。ロック後は半荘の追加・編集・削除が一切できなくなる。 */
export async function lockTable(groupId: string, tableId: string) {
  const { user, membership } = await requireMembership(groupId);
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || table.groupId !== groupId) throw new Error("対局記録が見つかりません");
  if (table.createdByUserId !== user.id && membership.role !== "owner") {
    throw new Error("この対局記録をロックできるのは作成者か管理者のみです");
  }

  await prisma.table.update({
    where: { id: tableId },
    data: { status: "locked", lockedAt: new Date() },
  });

  revalidatePath(`/g/${groupId}/tables/${tableId}`);
  revalidatePath(`/g/${groupId}/ranking`);
}
