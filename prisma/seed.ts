import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { calculateGameResults, toRuleSnapshot, type PlayerInput } from "../src/lib/mahjong/scoreEngine";
import { hashPassword } from "../src/lib/password";

/** シードユーザーの検証用パスワード(本番運用ではユーザーが登録時に自分で設定する) */
const SEED_PASSWORD_HASH = hashPassword("password1234");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 現在日時を2026-08-15(Q4シーズン中)と仮定してシードデータを組み立てる。
const NOW = new Date(2026, 7, 15, 12, 0, 0);

function at(year: number, month1: number, day: number, hour = 19, minute = 0): Date {
  return new Date(year, month1 - 1, day, hour, minute, 0);
}

async function main() {
  console.log("既存データを削除しています...");
  await prisma.gameResult.deleteMany();
  await prisma.game.deleteMany();
  await prisma.tableMember.deleteMany();
  await prisma.table.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupRule.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log("ユーザーを作成しています...");
  const [sato, takahashi, watanabe, tanaka, suzuki, ito, yamamoto, nakamura, kobayashi, kato] =
    await Promise.all(
      [
        ["佐藤", "sato@example.com", "experienced"],
        ["高橋", "takahashi@example.com", "experienced"],
        ["渡辺", "watanabe@example.com", "experienced"],
        ["田中", "tanaka@example.com", "beginner"],
        ["鈴木", "suzuki@example.com", "beginner"],
        ["伊藤", "ito@example.com", "beginner"],
        ["山本", "yamamoto@example.com", "inexperienced"],
        ["中村", "nakamura@example.com", "inexperienced"],
        ["小林", "kobayashi@example.com", "experienced"],
        ["加藤", "kato@example.com", "beginner"],
      ].map(([name, email, level]) =>
        prisma.user.create({
          data: {
            name,
            email,
            experienceLevel: level as "inexperienced" | "beginner" | "experienced",
            passwordHash: SEED_PASSWORD_HASH,
          },
        })
      )
    );

  console.log("Groupを作成しています...");
  const group = await prisma.group.create({
    data: {
      name: "聴牌部",
      ownerUserId: sato.id,
      seasonStartMonth: 9,
      memberships: {
        create: [
          { userId: sato.id, role: "owner" },
          { userId: takahashi.id, role: "member" },
          { userId: watanabe.id, role: "member" },
          { userId: tanaka.id, role: "member" },
          { userId: suzuki.id, role: "member" },
          { userId: ito.id, role: "member" },
          { userId: yamamoto.id, role: "member" },
          { userId: nakamura.id, role: "member" },
          { userId: kobayashi.id, role: "member" },
          { userId: kato.id, role: "member" },
        ],
      },
      rule: {
        create: {
          chipEnabled: true,
          chipValue: 1000,
        },
      },
    },
  });

  const groupRule = await prisma.groupRule.findUniqueOrThrow({ where: { groupId: group.id } });
  const ruleSnapshot = toRuleSnapshot(groupRule);
  const ruleSnapshotJson = JSON.stringify(ruleSnapshot);

  type Player = { user: { id: string; name: string }; finalScore: number; chipCount?: number };

  async function playGame(playedAt: Date, players: Player[]) {
    const event = await prisma.event.create({
      data: {
        groupId: group.id,
        title: `${playedAt.getMonth() + 1}/${playedAt.getDate()} 定例麻雀`,
        organizerUserId: sato.id,
        eventDatetime: playedAt,
        entryDeadline: playedAt,
        maxTables: 1,
        beginnerFriendly: false,
        status: "completed",
      },
    });

    const inputs: PlayerInput[] = players.map((p, i) => ({
      userId: p.user.id,
      seatOrder: i,
      finalScore: p.finalScore,
      chipCount: p.chipCount ?? 0,
    }));
    const results = calculateGameResults(inputs, ruleSnapshot);

    const game = await prisma.game.create({
      data: {
        groupId: group.id,
        eventId: event.id,
        playedAt,
        ruleSnapshot: ruleSnapshotJson,
        status: "confirmed",
        createdByUserId: sato.id,
        results: {
          create: results.map((r) => ({
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

    for (const p of players) {
      await prisma.entry.create({
        data: {
          eventId: event.id,
          userId: p.user.id,
          status: "played",
          enteredAt: playedAt,
          selectedAt: playedAt,
          playedAt,
        },
      });
    }

    return game;
  }

  console.log("過去の対局結果を作成しています(Q1〜Q4)...");
  // Q1: 2025/09-11
  await playGame(at(2025, 9, 20), [
    { user: sato, finalScore: 39800, chipCount: 2 },
    { user: takahashi, finalScore: 28200 },
    { user: watanabe, finalScore: 22600, chipCount: -1 },
    { user: tanaka, finalScore: 9400, chipCount: -1 },
  ]);
  await playGame(at(2025, 10, 18), [
    { user: takahashi, finalScore: 35500 },
    { user: kobayashi, finalScore: 27800 },
    { user: sato, finalScore: 21200 },
    { user: suzuki, finalScore: 15500 },
  ]);

  // Q2: 2025/12-2026/02
  await playGame(at(2025, 12, 12), [
    { user: watanabe, finalScore: 41000, chipCount: 3 },
    { user: sato, finalScore: 26000 },
    { user: ito, finalScore: 21500, chipCount: -2 },
    { user: takahashi, finalScore: 11500, chipCount: -1 },
  ]);
  await playGame(at(2026, 1, 16), [
    { user: sato, finalScore: 33200 },
    { user: kobayashi, finalScore: 29800 },
    { user: takahashi, finalScore: 22000 },
    { user: yamamoto, finalScore: 15000 },
  ]);

  // Q3: 2026/03-05
  await playGame(at(2026, 3, 14), [
    { user: takahashi, finalScore: 37400 },
    { user: watanabe, finalScore: 26600 },
    { user: nakamura, finalScore: 20500 },
    { user: sato, finalScore: 15500 },
  ]);
  await playGame(at(2026, 4, 25), [
    { user: kobayashi, finalScore: 40100, chipCount: 2 },
    { user: sato, finalScore: 25400 },
    { user: takahashi, finalScore: 22500, chipCount: -1 },
    { user: kato, finalScore: 12000, chipCount: -1 },
  ]);

  // Q4: 2026/06-08 (現在進行中クォーター)
  await playGame(at(2026, 6, 6), [
    { user: sato, finalScore: 38200 },
    { user: watanabe, finalScore: 27100 },
    { user: takahashi, finalScore: 21700 },
    { user: tanaka, finalScore: 13000 },
  ]);
  await playGame(at(2026, 7, 4), [
    { user: takahashi, finalScore: 34600 },
    { user: sato, finalScore: 28900 },
    { user: kobayashi, finalScore: 22500 },
    { user: watanabe, finalScore: 14000 },
  ]);
  const daysAgo = (n: number) => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - n);
    return d;
  };
  await playGame(daysAgo(20), [
    { user: watanabe, finalScore: 36700, chipCount: 4 },
    { user: takahashi, finalScore: 26300 },
    { user: ito, finalScore: 22000, chipCount: -2 },
    { user: sato, finalScore: 15000, chipCount: -2 },
  ]);

  console.log("募集中/参加履歴用のイベントを作成しています...");

  // ケース1: 3人応募中(あと1人で1卓)
  const eventA = await prisma.event.create({
    data: {
      groupId: group.id,
      title: "8/20 夜麻雀",
      organizerUserId: sato.id,
      eventDatetime: at(2026, 8, 20, 19, 0),
      entryDeadline: at(2026, 8, 18, 18, 0),
      maxTables: 2,
      beginnerFriendly: true,
      note: "20時半頃までの予定です",
      status: "open",
    },
  });
  for (const u of [takahashi, watanabe, tanaka]) {
    await prisma.entry.create({ data: { eventId: eventA.id, userId: u.id, status: "entered" } });
  }

  // ケース2: 7人応募中/最大2卓(8人) → あと1人で2卓成立
  const eventB = await prisma.event.create({
    data: {
      groupId: group.id,
      title: "8/22 初心者歓迎卓",
      organizerUserId: takahashi.id,
      eventDatetime: at(2026, 8, 22, 19, 30),
      entryDeadline: at(2026, 8, 21, 18, 0),
      maxTables: 2,
      beginnerFriendly: true,
      note: "初心者の方も大歓迎です！役一覧を見ながら気軽にどうぞ。",
      status: "open",
    },
  });
  for (const u of [sato, watanabe, kobayashi, tanaka, suzuki, ito, yamamoto]) {
    await prisma.entry.create({ data: { eventId: eventB.id, userId: u.id, status: "entered" } });
  }

  // ケース3: 10人応募/最大2卓(8人) → 参加調整が必要
  const eventC = await prisma.event.create({
    data: {
      groupId: group.id,
      title: "8/25 月末麻雀会",
      organizerUserId: watanabe.id,
      eventDatetime: at(2026, 8, 25, 19, 0),
      entryDeadline: at(2026, 8, 24, 18, 0),
      maxTables: 2,
      beginnerFriendly: false,
      note: null,
      status: "open",
    },
  });
  for (const u of [
    sato,
    takahashi,
    watanabe,
    kobayashi,
    tanaka,
    suzuki,
    ito,
    yamamoto,
    nakamura,
    kato,
  ]) {
    await prisma.entry.create({ data: { eventId: eventC.id, userId: u.id, status: "entered" } });
  }

  // ケース4: 4人ちょうど → 即成立、選定不要
  const eventD = await prisma.event.create({
    data: {
      groupId: group.id,
      title: "8/18 ランチ麻雀",
      organizerUserId: kobayashi.id,
      eventDatetime: at(2026, 8, 18, 12, 0),
      entryDeadline: at(2026, 8, 17, 18, 0),
      maxTables: 1,
      beginnerFriendly: false,
      note: "お昼休みにさくっと1半荘。",
      status: "open",
    },
  });
  for (const u of [sato, takahashi, watanabe, kobayashi]) {
    await prisma.entry.create({ data: { eventId: eventD.id, userId: u.id, status: "entered" } });
  }

  console.log("シード完了(全ユーザーの検証用パスワードは password1234 です)");
  console.log({ groupId: group.id, ownerUserId: sato.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
