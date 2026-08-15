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

/** 対局を新規作成する(仕様19章)。現在のGroupRuleをスナップショットとして保存する。 */
export async function createGame(
  groupId: string,
  eventId: string | null,
  players: PlayerFormInput[]
) {
  const { user } = await requireMembership(groupId);
  if (players.length !== 4) throw new Error("4人分の入力が必要です");

  const groupRule = await prisma.groupRule.findUniqueOrThrow({ where: { groupId } });
  const ruleSnapshot = toRuleSnapshot(groupRule);

  const inputs: PlayerInput[] = players.map((p, i) => ({
    userId: p.userId,
    seatOrder: i,
    finalScore: p.finalScore,
    chipCount: p.chipCount,
  }));
  const results = calculateGameResults(inputs, ruleSnapshot);

  const game = await prisma.game.create({
    data: {
      groupId,
      eventId: eventId ?? undefined,
      ruleSnapshot: JSON.stringify(ruleSnapshot),
      status: "draft",
      createdByUserId: user.id,
      results: { create: toGameResultRows(results) },
    },
  });

  revalidatePath(`/g/${groupId}`);
  redirect(`/g/${groupId}/games/${game.id}`);
}

/**
 * 対局結果を修正する(仕様27章)。必ずそのGame作成時点のrule_snapshotを使い、
 * GroupRuleが後で変わっていても過去対局の計算結果は変化しないようにする。
 */
export async function updateGame(groupId: string, gameId: string, players: PlayerFormInput[]) {
  const { user, membership } = await requireMembership(groupId);
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.groupId !== groupId) return;
  if (game.createdByUserId !== user.id && membership.role !== "owner") return;
  if (players.length !== 4) throw new Error("4人分の入力が必要です");

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

  revalidatePath(`/g/${groupId}/games/${gameId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  revalidatePath(`/g/${groupId}/mypage`);
  redirect(`/g/${groupId}/games/${gameId}`);
}

/** 下書きを確定する。Event参加者のplayed実績を反映する(仕様14, 34章)。 */
export async function confirmGame(groupId: string, gameId: string) {
  await requireMembership(groupId);
  const game = await prisma.game.findUnique({ where: { id: gameId }, include: { results: true } });
  if (!game || game.groupId !== groupId) return;

  await prisma.game.update({ where: { id: gameId }, data: { status: "confirmed" } });

  if (game.eventId) {
    const eventId = game.eventId;
    const playedAt = new Date();
    await Promise.all(
      game.results.map((r) =>
        prisma.entry.updateMany({
          where: { eventId, userId: r.userId },
          data: { status: "played", playedAt },
        })
      )
    );
    const remaining = await prisma.entry.count({
      where: { eventId, status: { in: ["entered", "selected"] } },
    });
    if (remaining === 0) {
      await prisma.event.update({ where: { id: eventId }, data: { status: "completed" } });
    }
    revalidatePath(`/g/${groupId}/events/${eventId}`);
  }

  revalidatePath(`/g/${groupId}/games/${gameId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  revalidatePath(`/g/${groupId}/mypage`);
  revalidatePath(`/g/${groupId}`);
}

/** この対局を無効にする。ランキング集計から除外されるが記録は残す(仕様27章)。 */
export async function voidGame(groupId: string, gameId: string) {
  const { user, membership } = await requireMembership(groupId);
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.groupId !== groupId) return;
  if (game.createdByUserId !== user.id && membership.role !== "owner") return;

  await prisma.game.update({ where: { id: gameId }, data: { status: "void" } });

  revalidatePath(`/g/${groupId}/games/${gameId}`);
  revalidatePath(`/g/${groupId}/ranking`);
  revalidatePath(`/g/${groupId}/mypage`);
}

/** 下書きを破棄する(確定前のみ)。 */
export async function discardDraftGame(groupId: string, gameId: string) {
  const { user, membership } = await requireMembership(groupId);
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.groupId !== groupId || game.status !== "draft") return;
  if (game.createdByUserId !== user.id && membership.role !== "owner") return;

  await prisma.gameResult.deleteMany({ where: { gameId } });
  await prisma.game.delete({ where: { id: gameId } });

  redirect(game.eventId ? `/g/${groupId}/events/${game.eventId}` : `/g/${groupId}`);
}
