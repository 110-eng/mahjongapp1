import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// 現在日時を2026-08-15(Q4シーズン中)と仮定してシードデータを組み立てる。
const NOW = new Date(2026, 7, 15, 12, 0, 0);

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function at(year: number, month1: number, day: number, hour = 19, minute = 0): Date {
  return new Date(year, month1 - 1, day, hour, minute, 0);
}

async function main() {
  console.log("既存データを削除しています...");
  await prisma.gameResult.deleteMany();
  await prisma.game.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log("ユーザーを作成しています...");
  const [sato, takahashi, watanabe, tanaka, suzuki, ito, yamamoto, nakamura, kobayashi, kato] =
    await Promise.all(
      [
        ["佐藤", "experienced"],
        ["高橋", "experienced"],
        ["渡辺", "experienced"],
        ["田中", "beginner"],
        ["鈴木", "beginner"],
        ["伊藤", "beginner"],
        ["山本", "inexperienced"],
        ["中村", "inexperienced"],
        ["小林", "experienced"],
        ["加藤", "beginner"],
      ].map(([name, level]) =>
        prisma.user.create({
          data: { name, experienceLevel: level as "inexperienced" | "beginner" | "experienced" },
        })
      )
    );

  // --- 過去の対局結果(ランキング用) ---
  // 仮のウマ: 1位+30, 2位+10, 3位-10, 4位-30 (仕様24章の通りREADMEにTODO明記する仮ルール)
  const UMA = [30, 10, -10, -30];

  async function createCompletedGame(playedAt: Date) {
    const event = await prisma.event.create({
      data: {
        title: `${playedAt.getMonth() + 1}/${playedAt.getDate()} 定例麻雀`,
        organizerUserId: sato.id,
        eventDatetime: playedAt,
        entryDeadline: daysAgo(1),
        maxTables: 1,
        beginnerFriendly: false,
        status: "completed",
      },
    });
    const game = await prisma.game.create({
      data: { eventId: event.id, playedAt },
    });
    return { event, game };
  }

  type Player = { user: { id: string; name: string }; scoreOrder: number };

  async function playGame(playedAt: Date, players: Player[]) {
    const { game } = await createCompletedGame(playedAt);
    const sorted = [...players].sort((a, b) => a.scoreOrder - b.scoreOrder);
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      await prisma.gameResult.create({
        data: {
          gameId: game.id,
          userId: p.user.id,
          rank: i + 1,
          score: 25000 + UMA[i] * 100,
          rankingPoint: UMA[i],
        },
      });
      await prisma.entry.create({
        data: {
          eventId: game.eventId,
          userId: p.user.id,
          status: "played",
          enteredAt: playedAt,
          selectedAt: playedAt,
          playedAt,
        },
      });
    }
  }

  console.log("過去の対局結果を作成しています(Q1〜Q4)...");
  // Q1: 2025/09-11
  await playGame(at(2025, 9, 20), [
    { user: sato, scoreOrder: 1 },
    { user: takahashi, scoreOrder: 2 },
    { user: watanabe, scoreOrder: 3 },
    { user: tanaka, scoreOrder: 4 },
  ]);
  await playGame(at(2025, 10, 18), [
    { user: takahashi, scoreOrder: 1 },
    { user: kobayashi, scoreOrder: 2 },
    { user: sato, scoreOrder: 3 },
    { user: suzuki, scoreOrder: 4 },
  ]);

  // Q2: 2025/12-2026/02
  await playGame(at(2025, 12, 12), [
    { user: watanabe, scoreOrder: 1 },
    { user: sato, scoreOrder: 2 },
    { user: ito, scoreOrder: 3 },
    { user: takahashi, scoreOrder: 4 },
  ]);
  await playGame(at(2026, 1, 16), [
    { user: sato, scoreOrder: 1 },
    { user: kobayashi, scoreOrder: 2 },
    { user: takahashi, scoreOrder: 3 },
    { user: yamamoto, scoreOrder: 4 },
  ]);

  // Q3: 2026/03-05
  await playGame(at(2026, 3, 14), [
    { user: takahashi, scoreOrder: 1 },
    { user: watanabe, scoreOrder: 2 },
    { user: nakamura, scoreOrder: 3 },
    { user: sato, scoreOrder: 4 },
  ]);
  await playGame(at(2026, 4, 25), [
    { user: kobayashi, scoreOrder: 1 },
    { user: sato, scoreOrder: 2 },
    { user: takahashi, scoreOrder: 3 },
    { user: kato, scoreOrder: 4 },
  ]);

  // Q4: 2026/06-08 (現在進行中クォーター)
  await playGame(at(2026, 6, 6), [
    { user: sato, scoreOrder: 1 },
    { user: watanabe, scoreOrder: 2 },
    { user: takahashi, scoreOrder: 3 },
    { user: tanaka, scoreOrder: 4 },
  ]);
  await playGame(at(2026, 7, 4), [
    { user: takahashi, scoreOrder: 1 },
    { user: sato, scoreOrder: 2 },
    { user: kobayashi, scoreOrder: 3 },
    { user: watanabe, scoreOrder: 4 },
  ]);
  await playGame(daysAgo(20), [
    { user: watanabe, scoreOrder: 1 },
    { user: takahashi, scoreOrder: 2 },
    { user: ito, scoreOrder: 3 },
    { user: sato, scoreOrder: 4 },
  ]);

  console.log("募集中/参加履歴用のイベントを作成しています...");

  // ケース1: 3人応募中(あと1人で1卓)。常連は最近参加済みなのでcasualの参加を促す文脈になる。
  const eventA = await prisma.event.create({
    data: {
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
    await prisma.entry.create({
      data: { eventId: eventA.id, userId: u.id, status: "entered" },
    });
  }

  // ケース2: 7人応募中/最大2卓(8人) → あと1人で2卓成立
  const eventB = await prisma.event.create({
    data: {
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
    await prisma.entry.create({
      data: { eventId: eventB.id, userId: u.id, status: "entered" },
    });
  }

  // ケース3: 10人応募/最大2卓(8人) → 参加調整が必要
  const eventC = await prisma.event.create({
    data: {
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
  for (const u of [sato, takahashi, watanabe, kobayashi, tanaka, suzuki, ito, yamamoto, nakamura, kato]) {
    await prisma.entry.create({
      data: { eventId: eventC.id, userId: u.id, status: "entered" },
    });
  }

  // ケース4: 4人ちょうど → 即成立、選定不要
  const eventD = await prisma.event.create({
    data: {
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
    await prisma.entry.create({
      data: { eventId: eventD.id, userId: u.id, status: "entered" },
    });
  }

  console.log("シード完了");
  console.log({
    users: { sato, takahashi, watanabe, tanaka, suzuki, ito, yamamoto, nakamura, kobayashi, kato },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
