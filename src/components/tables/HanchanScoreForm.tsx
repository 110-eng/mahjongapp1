"use client";

import { useState, useTransition } from "react";
import { createHanchan, updateHanchan } from "@/app/g/[groupId]/tables/actions";
import { validatePlayerInputs, type RuleSnapshot } from "@/lib/mahjong/scoreEngine";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type RosterMember = { userId: string; userName: string };
type FixedPlayer = RosterMember & { finalScore: number; chipCount: number };

/**
 * 半荘1件分のスコア入力フォーム。ロスターから参加4人を選ぶ段階と、
 * 最終持ち点/チップを入力する段階の2段階(既存のGameScoreFormと同じ構成)。
 */
export function HanchanScoreForm({
  groupId,
  tableId,
  rule,
  mode,
  gameId,
  roster,
  fixedPlayers,
}: {
  groupId: string;
  tableId: string;
  rule: RuleSnapshot;
  mode: "new" | "edit";
  gameId?: string;
  roster?: RosterMember[];
  fixedPlayers?: FixedPlayer[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(fixedPlayers ? fixedPlayers.map((p) => p.userId) : [])
  );
  const [stage, setStage] = useState<"select" | "input">(fixedPlayers ? "input" : "select");
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries((fixedPlayers ?? []).map((p) => [p.userId, String(p.finalScore)]))
  );
  const [chips, setChips] = useState<Record<string, string>>(
    Object.fromEntries((fixedPlayers ?? []).map((p) => [p.userId, String(p.chipCount)]))
  );
  const [isPending, startTransition] = useTransition();

  const players: RosterMember[] =
    fixedPlayers ?? (roster ?? []).filter((c) => selected.has(c.userId));

  const toggleCandidate = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else if (next.size < 4) next.add(userId);
      return next;
    });
  };

  const proceedToInput = () => {
    setScores((prev) => {
      const next = { ...prev };
      for (const p of players) if (!(p.userId in next)) next[p.userId] = String(rule.startingPoints);
      return next;
    });
    setChips((prev) => {
      const next = { ...prev };
      for (const p of players) if (!(p.userId in next)) next[p.userId] = "0";
      return next;
    });
    setStage("input");
  };

  const parsedPlayers = players.map((p) => ({
    userId: p.userId,
    finalScore: Number(scores[p.userId] ?? 0),
    chipCount: Number(chips[p.userId] ?? 0),
  }));

  const validation = validatePlayerInputs(parsedPlayers, rule);

  const canSubmit =
    players.length === 4 &&
    parsedPlayers.every((p) => Number.isFinite(p.finalScore) && Number.isFinite(p.chipCount));

  if (stage === "select") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-600">この半荘に参加した4人を選んでください。</p>
        <Card className="divide-y divide-ink-400/10">
          {(roster ?? []).map((c) => (
            <label key={c.userId} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold-500"
                checked={selected.has(c.userId)}
                onChange={() => toggleCandidate(c.userId)}
                disabled={!selected.has(c.userId) && selected.size >= 4}
              />
              <span className="text-sm text-ink-900">{c.userName}</span>
            </label>
          ))}
        </Card>
        <p className="text-xs text-ink-400">選択中: {selected.size}/4人</p>
        <Button
          variant="secondary"
          className="w-full"
          disabled={selected.size !== 4}
          onClick={proceedToInput}
        >
          次へ(最終持ち点を入力)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="divide-y divide-ink-400/10">
        {players.map((p) => (
          <div key={p.userId} className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">{p.userName}</p>
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-ink-400">最終持ち点</label>
              <input
                type="number"
                step={100}
                inputMode="numeric"
                value={scores[p.userId] ?? ""}
                onChange={(e) => setScores((s) => ({ ...s, [p.userId]: e.target.value }))}
                className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-right text-sm outline-none focus:border-gold-500"
              />
              <span className="text-xs text-ink-400">点</span>
            </div>
            {rule.chipEnabled && (
              <div className="flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs text-ink-400">チップ</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={chips[p.userId] ?? "0"}
                  onChange={(e) => setChips((s) => ({ ...s, [p.userId]: e.target.value }))}
                  className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-right text-sm outline-none focus:border-gold-500"
                />
                <span className="text-xs text-ink-400">枚</span>
              </div>
            )}
          </div>
        ))}
      </Card>

      <div className="space-y-1 text-xs">
        <p className={validation.isScoreBalanced ? "text-ink-400" : "text-red-600 font-medium"}>
          持ち点合計: {validation.actualTotal.toLocaleString()}点 (基準
          {validation.expectedTotal.toLocaleString()}点)
          {!validation.isScoreBalanced &&
            ` ・ 合計が${Math.abs(validation.scoreDiff).toLocaleString()}点合いません`}
        </p>
        {rule.chipEnabled && (
          <p className={validation.isChipBalanced ? "text-ink-400" : "text-red-600 font-medium"}>
            チップ合計: {validation.chipTotal}枚
            {!validation.isChipBalanced && " ・ 合計が0枚になっていません"}
          </p>
        )}
      </div>

      <Button
        variant="secondary"
        className="w-full"
        disabled={!canSubmit || isPending}
        onClick={() =>
          startTransition(async () => {
            if (mode === "new") {
              await createHanchan(groupId, tableId, parsedPlayers);
            } else if (gameId) {
              await updateHanchan(groupId, tableId, gameId, parsedPlayers);
            }
          })
        }
      >
        {isPending ? "計算中..." : "自動計算して確認する"}
      </Button>
    </div>
  );
}
