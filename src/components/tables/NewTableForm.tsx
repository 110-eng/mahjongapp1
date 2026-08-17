"use client";

import { useState, useTransition } from "react";
import { createTable } from "@/app/g/[groupId]/tables/actions";
import { MemberPicker, type PickerCandidate } from "@/components/tables/MemberPicker";
import { Button } from "@/components/ui/Button";

function todayInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function NewTableForm({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: PickerCandidate[];
}) {
  const [date, setDate] = useState(todayInputValue());
  const [selected, setSelected] = useState<PickerCandidate[]>([]);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const remaining = candidates.filter((c) => !selected.some((s) => s.userId === c.userId));
  const addedMembers = [
    ...selected.map((s) => ({ key: s.userId, label: s.userName })),
    ...guestNames.map((name, i) => ({ key: `guest-${i}`, label: `${name}(ゲスト)` })),
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs text-ink-400">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
        />
      </div>

      <MemberPicker
        candidates={remaining}
        addedMembers={addedMembers}
        pending={isPending}
        onAddCandidate={(userId) => {
          const c = candidates.find((x) => x.userId === userId);
          if (c) setSelected((prev) => [...prev, c]);
        }}
        onAddGuest={(name) => setGuestNames((prev) => [...prev, name])}
      />

      <Button
        variant="secondary"
        className="w-full"
        disabled={addedMembers.length === 0 || isPending}
        onClick={() =>
          startTransition(() =>
            createTable(
              groupId,
              new Date(`${date}T00:00:00`).toISOString(),
              selected.map((s) => s.userId),
              guestNames
            )
          )
        }
      >
        {isPending ? "作成中..." : "対局記録を作成する"}
      </Button>
    </div>
  );
}
