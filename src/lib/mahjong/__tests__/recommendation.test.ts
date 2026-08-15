import { describe, it, expect } from "vitest";
import {
  scoreParticipant,
  recommendParticipants,
  buildParticipationStatusMessage,
  type ParticipantStats,
} from "../recommendation";

const now = new Date(2026, 7, 15); // 2026/08/15

describe("scoreParticipant", () => {
  it("初参加者は初参加ボーナスが加算される", () => {
    const r = scoreParticipant(
      { userId: "u1", userName: "初", validEntryCount: 0, playedCount: 0, lastPlayedAt: null },
      now
    );
    expect(r.isFirstTime).toBe(true);
    expect(r.reasons.some((x) => x.includes("初参加"))).toBe(true);
  });

  it("参加率が低い人は高スコアになる", () => {
    const lowRate = scoreParticipant(
      {
        userId: "u2",
        userName: "低参加率",
        validEntryCount: 10,
        playedCount: 1,
        lastPlayedAt: new Date(2026, 6, 1),
      },
      now
    );
    const highRate = scoreParticipant(
      {
        userId: "u3",
        userName: "高参加率",
        validEntryCount: 10,
        playedCount: 9,
        lastPlayedAt: new Date(2026, 6, 1),
      },
      now
    );
    expect(lowRate.score).toBeGreaterThan(highRate.score);
  });

  it("最終対局が古い人ほど優先度が上がる", () => {
    const old = scoreParticipant(
      {
        userId: "u4",
        userName: "久しぶり",
        validEntryCount: 5,
        playedCount: 3,
        lastPlayedAt: new Date(2026, 0, 1),
      },
      now
    );
    const recent = scoreParticipant(
      {
        userId: "u5",
        userName: "最近",
        validEntryCount: 5,
        playedCount: 3,
        lastPlayedAt: new Date(2026, 7, 10),
      },
      now
    );
    expect(old.score).toBeGreaterThan(recent.score);
  });

  it("応募母数1件で不参加でも参加率0%が過度に優遇されない(母数10件で1回参加より低くなることがある)", () => {
    const oneEntryZeroPlay = scoreParticipant(
      {
        userId: "u6",
        userName: "母数1",
        validEntryCount: 1,
        playedCount: 0,
        lastPlayedAt: null,
      },
      now
    );
    const manyEntriesLowRate = scoreParticipant(
      {
        userId: "u7",
        userName: "母数10低参加率",
        validEntryCount: 10,
        playedCount: 1,
        lastPlayedAt: new Date(2026, 0, 1),
      },
      now
    );
    // 母数1件の参加率0%が、母数の多い低参加率者より不当に高くならないこと
    expect(oneEntryZeroPlay.score).toBeLessThan(manyEntriesLowRate.score);
  });

  it("本人キャンセルは有効応募回数(validEntryCount)に含まれない前提のためスコアに影響しない", () => {
    // validEntryCountは呼び出し側で「応募 - 本人キャンセル」として渡す想定
    const r = scoreParticipant(
      { userId: "u8", userName: "x", validEntryCount: 3, playedCount: 3, lastPlayedAt: now },
      now
    );
    expect(r.participationRate).toBe(1);
  });
});

describe("recommendParticipants", () => {
  it("スコア上位から必要人数を推薦する", () => {
    const candidates: ParticipantStats[] = [
      { userId: "a", userName: "A", validEntryCount: 0, playedCount: 0, lastPlayedAt: null }, // 初参加
      {
        userId: "b",
        userName: "B",
        validEntryCount: 8,
        playedCount: 7,
        lastPlayedAt: new Date(2026, 7, 14),
      }, // 高参加率・直近参加
      {
        userId: "c",
        userName: "C",
        validEntryCount: 8,
        playedCount: 1,
        lastPlayedAt: new Date(2026, 1, 1),
      }, // 低参加率・久しぶり
    ];
    const { recommended } = recommendParticipants(candidates, 2, now);
    const ids = recommended.map((r) => r.userId);
    expect(ids).toContain("a");
    expect(ids).toContain("c");
    expect(ids).not.toContain("b");
  });
});

describe("buildParticipationStatusMessage", () => {
  it("初参加者向けメッセージ", () => {
    const r = buildParticipationStatusMessage(
      { validEntryCount: 0, playedCount: 0, lastPlayedAt: null },
      now
    );
    expect(r.type).toBe("first_time");
  });

  it("最近参加が少ない人向けメッセージ", () => {
    const r = buildParticipationStatusMessage(
      {
        validEntryCount: 5,
        playedCount: 3,
        lastPlayedAt: new Date(2026, 5, 1),
      },
      now
    );
    expect(r.type).toBe("low_recent");
  });

  it("最近参加している人向けメッセージには抑制表現を含まない", () => {
    const r = buildParticipationStatusMessage(
      {
        validEntryCount: 5,
        playedCount: 3,
        lastPlayedAt: new Date(2026, 7, 10),
      },
      now
    );
    expect(r.type).toBe("active");
    expect(r.message).not.toMatch(/優先度|非推奨|譲/);
  });
});
