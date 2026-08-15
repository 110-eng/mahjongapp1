/**
 * Group分離・権限・ランキング集計・JOIN連携の統合テスト(仕様49章)。
 *
 * 実際のSQLiteに対してPrismaでクエリを実行する統合テスト。
 * 開発用DB(dev.db)は汚さず、テスト専用のDBファイルを都度作り直す。
 *
 * 注意: requireMembership/requireOwner(src/lib/auth.ts)はnext/headersのcookies()に
 * 依存しておりNext.jsのリクエストスコープ外(vitest)では呼び出せないため、
 * それらが内部で使うDB層(getMembership, Groupスコープ付きクエリ)を直接検証する。
 * 実際の認可ゲート(Owner以外はredirectされること)はブラウザ経由で別途確認済み。
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- 動的importするテスト対象モジュールの型を都度定義するより、
   統合テストとしての可読性を優先する */
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_DB_RELATIVE = "prisma/test-integration.db";
const TEST_DB_ABSOLUTE = path.resolve(process.cwd(), TEST_DB_RELATIVE);
const TEST_DATABASE_URL = `file:./${TEST_DB_RELATIVE}`;

let prisma: any;
let queries: any;
let authLib: any;
let rankingLib: any;
let seasonLib: any;
let scoreEngineLib: any;

function cleanupDbFiles() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const f = TEST_DB_ABSOLUTE + suffix;
    if (fs.existsSync(f)) fs.rmSync(f);
  }
}

beforeAll(async () => {
  cleanupDbFiles();
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  ({ prisma } = await import("@/lib/prisma"));
  queries = await import("@/lib/mahjong/queries");
  authLib = await import("@/lib/auth");
  rankingLib = await import("@/lib/mahjong/ranking");
  seasonLib = await import("@/lib/mahjong/season");
  scoreEngineLib = await import("@/lib/mahjong/scoreEngine");
}, 30000);

afterAll(async () => {
  await prisma?.$disconnect();
  cleanupDbFiles();
});

async function createUser(name: string) {
  return prisma.user.create({ data: { name } });
}

async function createGroupWithOwner(name: string, ownerUserId: string, seasonStartMonth = 9) {
  return prisma.group.create({
    data: {
      name,
      ownerUserId,
      seasonStartMonth,
      memberships: { create: [{ userId: ownerUserId, role: "owner" }] },
      rule: { create: {} },
    },
  });
}

describe("Groupデータ分離", () => {
  it("他Groupのイベントは見えない(getEventDetail)", async () => {
    const owner = await createUser("OwnerA");
    const groupA = await createGroupWithOwner("GroupA", owner.id);
    const groupB = await createGroupWithOwner("GroupB", owner.id);

    const eventInA = await prisma.event.create({
      data: {
        groupId: groupA.id,
        title: "GroupAの卓",
        organizerUserId: owner.id,
        eventDatetime: new Date(),
        entryDeadline: new Date(),
        maxTables: 1,
        status: "open",
      },
    });

    const fromA = await queries.getEventDetail(groupA.id, eventInA.id);
    expect(fromA).not.toBeNull();

    const fromB = await queries.getEventDetail(groupB.id, eventInA.id);
    expect(fromB).toBeNull();
  });

  it("他Groupの募集一覧に混ざらない(listOpenEvents)", async () => {
    const owner = await createUser("OwnerB");
    const groupA = await createGroupWithOwner("GroupC", owner.id);
    const groupB = await createGroupWithOwner("GroupD", owner.id);

    await prisma.event.create({
      data: {
        groupId: groupA.id,
        title: "GroupC専用",
        organizerUserId: owner.id,
        eventDatetime: new Date(),
        entryDeadline: new Date(),
        maxTables: 1,
        status: "open",
      },
    });

    const openInB = await queries.listOpenEvents(groupB.id);
    expect(openInB.some((e: any) => e.event.title === "GroupC専用")).toBe(false);
  });

  it("他Groupの対局結果はランキング集計に混ざらない(getConfirmedGameResults)", async () => {
    const owner = await createUser("OwnerC");
    const groupA = await createGroupWithOwner("GroupE", owner.id);
    const groupB = await createGroupWithOwner("GroupF", owner.id);

    const rule = scoreEngineLib.DEFAULT_RULE_SNAPSHOT;
    const inputs = [owner].concat(
      await Promise.all([createUser("p2"), createUser("p3"), createUser("p4")])
    );
    const players = inputs.map((u: any, i: number) => ({
      userId: u.id,
      seatOrder: i,
      finalScore: [40000, 30000, 20000, 10000][i],
    }));
    const results = scoreEngineLib.calculateGameResults(players, rule);

    await prisma.game.create({
      data: {
        groupId: groupA.id,
        playedAt: new Date(),
        ruleSnapshot: JSON.stringify(rule),
        status: "confirmed",
        createdByUserId: owner.id,
        results: {
          create: results.map((r: any) => ({
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
          })),
        },
      },
    });

    const resultsForB = await queries.getConfirmedGameResults(groupB.id);
    expect(resultsForB).toHaveLength(0);
    const resultsForA = await queries.getConfirmedGameResults(groupA.id);
    expect(resultsForA).toHaveLength(4);
  });
});

describe("権限(GroupMembership.role)", () => {
  it("Groupを作成したユーザーはowner roleを持つ", async () => {
    const owner = await createUser("Owner権限テスト");
    const group = await createGroupWithOwner("権限Group1", owner.id);
    const membership = await authLib.getMembership(group.id, owner.id);
    expect(membership?.role).toBe("owner");
  });

  it("後から参加したユーザーはmember roleを持ち、Memberでも卓(Event)を作成できる", async () => {
    const owner = await createUser("Owner権限テスト2");
    const member = await createUser("Member権限テスト");
    const group = await createGroupWithOwner("権限Group2", owner.id);
    await prisma.groupMembership.create({
      data: { groupId: group.id, userId: member.id, role: "member" },
    });

    const membership = await authLib.getMembership(group.id, member.id);
    expect(membership?.role).toBe("member");

    // 卓作成をOwner限定にしないこと(仕様6章) — Memberでも作成できる
    const event = await prisma.event.create({
      data: {
        groupId: group.id,
        title: "Memberが立てた卓",
        organizerUserId: member.id,
        eventDatetime: new Date(),
        entryDeadline: new Date(),
        maxTables: 1,
        status: "open",
      },
    });
    expect(event.organizerUserId).toBe(member.id);
  });

  it("Ownerのみが持つGroupRuleは、Owner/Member問わずGroupに1件だけ紐づく(変更はOwnerのみが行える運用)", async () => {
    const owner = await createUser("Owner権限テスト3");
    const group = await createGroupWithOwner("権限Group3", owner.id);
    const rule = await prisma.groupRule.findUnique({ where: { groupId: group.id } });
    expect(rule).not.toBeNull();
    // requireOwner()はnext/headersに依存するためNext.jsランタイム外では直接実行できないが、
    // ロールがownerであることの判定自体はここで検証できる。
    const membership = await authLib.getMembership(group.id, owner.id);
    expect(membership?.role).toBe("owner");
  });
});

describe("ランキング集計(Group/Quarter/Season/confirmed/void)", () => {
  it("draft/voidのGameはランキングに含まれない", async () => {
    const owner = await createUser("RankOwner");
    const group = await createGroupWithOwner("RankGroup", owner.id);
    const users = [owner, await createUser("r2"), await createUser("r3"), await createUser("r4")];
    const rule = scoreEngineLib.DEFAULT_RULE_SNAPSHOT;

    async function makeGame(status: "draft" | "confirmed" | "void", playedAt: Date) {
      const players = users.map((u, i) => ({
        userId: u.id,
        seatOrder: i,
        finalScore: [40000, 30000, 20000, 10000][i],
      }));
      const results = scoreEngineLib.calculateGameResults(players, rule);
      return prisma.game.create({
        data: {
          groupId: group.id,
          playedAt,
          ruleSnapshot: JSON.stringify(rule),
          status,
          createdByUserId: owner.id,
          results: {
            create: results.map((r: any) => ({
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
            })),
          },
        },
      });
    }

    const playedAt = new Date(2026, 8, 10); // Q1
    await makeGame("confirmed", playedAt);
    await makeGame("draft", playedAt);
    await makeGame("void", playedAt);

    const results = await queries.getConfirmedGameResults(group.id);
    // confirmedの1半荘分(4件)のみ
    expect(results).toHaveLength(4);
  });

  it("Quarter/Season範囲で正しく絞り込まれる", async () => {
    const owner = await createUser("QOwner");
    const group = await createGroupWithOwner("QGroup", owner.id, 9);
    const users = [owner, await createUser("q2"), await createUser("q3"), await createUser("q4")];
    const rule = scoreEngineLib.DEFAULT_RULE_SNAPSHOT;

    async function makeConfirmedGame(playedAt: Date) {
      const players = users.map((u, i) => ({
        userId: u.id,
        seatOrder: i,
        finalScore: [40000, 30000, 20000, 10000][i],
      }));
      const results = scoreEngineLib.calculateGameResults(players, rule);
      await prisma.game.create({
        data: {
          groupId: group.id,
          playedAt,
          ruleSnapshot: JSON.stringify(rule),
          status: "confirmed",
          createdByUserId: owner.id,
          results: {
            create: results.map((r: any) => ({
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
            })),
          },
        },
      });
    }

    await makeConfirmedGame(new Date(2025, 8, 15)); // Q1 (2025年度)
    await makeConfirmedGame(new Date(2026, 5, 15)); // Q4 (2025年度)

    const allResults = await queries.getConfirmedGameResults(group.id);
    const q1Range = seasonLib.getQuarterRange(2025, 1, 9);
    const q4Range = seasonLib.getQuarterRange(2025, 4, 9);
    const seasonRange = seasonLib.getSeasonRange(2025, 9);

    const q1Ranking = rankingLib.calculateRanking(allResults, q1Range);
    const q4Ranking = rankingLib.calculateRanking(allResults, q4Range);
    const seasonRanking = rankingLib.calculateRanking(allResults, seasonRange);

    expect(q1Ranking.find((r: any) => r.userId === owner.id)?.gamesPlayed).toBe(1);
    expect(q4Ranking.find((r: any) => r.userId === owner.id)?.gamesPlayed).toBe(1);
    expect(seasonRanking.find((r: any) => r.userId === owner.id)?.gamesPlayed).toBe(2);
  });
});

describe("JOINとの連携(仕様34章)", () => {
  it("Game確定相当の処理(Entry.status更新)後、参加履歴とレコメンド統計に反映される", async () => {
    const organizer = await createUser("JoinOwner");
    const group = await createGroupWithOwner("JoinGroup", organizer.id);
    const player = await createUser("JoinPlayer");
    await prisma.groupMembership.create({
      data: { groupId: group.id, userId: player.id, role: "member" },
    });

    const event = await prisma.event.create({
      data: {
        groupId: group.id,
        title: "参加履歴テスト卓",
        organizerUserId: organizer.id,
        eventDatetime: new Date(),
        entryDeadline: new Date(),
        maxTables: 1,
        status: "open",
      },
    });
    await prisma.entry.create({
      data: { eventId: event.id, userId: player.id, status: "entered" },
    });

    const beforeStats = await queries.getParticipantStats(player.id, group.id);
    expect(beforeStats.playedCount).toBe(0);
    expect(beforeStats.lastPlayedAt).toBeNull();

    // confirmGame(Server Action)相当のDB更新(Entryをplayedへ)
    const playedAt = new Date();
    await prisma.entry.updateMany({
      where: { eventId: event.id, userId: player.id },
      data: { status: "played", playedAt },
    });

    const afterStats = await queries.getParticipantStats(player.id, group.id);
    expect(afterStats.playedCount).toBe(1);
    expect(afterStats.lastPlayedAt?.getTime()).toBe(playedAt.getTime());
  });
});
