"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type PickerCandidate = { userId: string; userName: string };
export type AddedMember = { key: string; label: string };

/**
 * 「面子の追加」UI(氏名検索+追加 / ゲスト追加 / 登録済みの面子)。
 * 対局記録の新規作成(まだ未保存)と、既存の対局記録への追加(即時保存)の両方で使う。
 */
export function MemberPicker({
  candidates,
  addedMembers,
  onAddCandidate,
  onAddGuest,
  pending,
}: {
  candidates: PickerCandidate[];
  addedMembers: AddedMember[];
  onAddCandidate: (userId: string) => void;
  onAddGuest: (name: string) => void;
  pending?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const filtered = candidates.filter((c) => c.userName.includes(query));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">面子の追加</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="氏名で検索"
          className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
        />
        <Card className="max-h-72 divide-y divide-ink-400/10 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-ink-400">追加できるメンバーがいません。</p>
          )}
          {filtered.map((c) => (
            <div key={c.userId} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-900">{c.userName}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => onAddCandidate(c.userId)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-board-800 text-washi-100 disabled:opacity-40 cursor-pointer"
              >
                ＋
              </button>
            </div>
          ))}
        </Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = guestName.trim();
            if (!trimmed) return;
            onAddGuest(trimmed);
            setGuestName("");
          }}
          className="flex gap-2"
        >
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ゲスト名を入力"
            className="flex-1 rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
          />
          <Button type="submit" variant="ghost" disabled={pending}>
            ゲストユーザーを追加
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-900">登録済みの面子</h2>
        <Card className="divide-y divide-ink-400/10">
          {addedMembers.length === 0 && (
            <p className="p-4 text-sm text-ink-400">まだ面子が登録されていません。</p>
          )}
          {addedMembers.map((m, i) => (
            <div key={m.key} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-center text-sm text-ink-400">{i + 1}</span>
              <span className="text-sm text-ink-900">{m.label}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
