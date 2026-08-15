"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordGameResult } from "@/app/(main)/events/[id]/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function GameResultForm({
  eventId,
  tableNumber,
  players,
}: {
  eventId: string;
  tableNumber: number;
  players: { entryId: string; userId: string; userName: string }[];
}) {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(players.map((p) => [p.entryId, "25000"]))
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canSubmit = players.every((p) => scores[p.entryId] !== "" && !isNaN(Number(scores[p.entryId])));

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-ink-900">卓{tableNumber}</h3>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.entryId} className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-900">{p.userName}</span>
            <input
              type="number"
              step={100}
              value={scores[p.entryId]}
              onChange={(e) => setScores((s) => ({ ...s, [p.entryId]: e.target.value }))}
              className="w-28 rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-1.5 text-right text-sm outline-none focus:border-gold-500"
            />
          </div>
        ))}
      </div>
      <Button
        variant="primary"
        className="w-full"
        disabled={!canSubmit || isPending}
        onClick={() =>
          startTransition(async () => {
            await recordGameResult(
              eventId,
              players.map((p) => ({
                entryId: p.entryId,
                userId: p.userId,
                score: Number(scores[p.entryId]),
              }))
            );
            router.refresh();
          })
        }
      >
        {isPending ? "記録中..." : `卓${tableNumber}の結果を記録する`}
      </Button>
    </Card>
  );
}
