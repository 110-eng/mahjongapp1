"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { YAKU_LIST, YAKU_CATEGORIES, type YakuCategory } from "@/lib/mahjong/yaku";

export function YakuFilterList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<YakuCategory | "all">("all");

  const filtered = useMemo(() => {
    return YAKU_LIST.filter((y) => {
      if (category !== "all" && y.category !== category) return false;
      if (query && !y.name.includes(query)) return false;
      return true;
    });
  }, [query, category]);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="役名で検索"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            category === "all"
              ? "border-gold-500 bg-gold-500/10 font-semibold text-board-800"
              : "border-ink-400/20 text-ink-600"
          }`}
        >
          すべて
        </button>
        {YAKU_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              category === c
                ? "border-gold-500 bg-gold-500/10 font-semibold text-board-800"
                : "border-ink-400/20 text-ink-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-ink-400/10">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-ink-400">該当する役が見つかりませんでした。</p>
        )}
        {filtered.map((y) => (
          <div key={y.key} className="space-y-1 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink-900">{y.name}</span>
              <Badge tone="gold">{y.han}</Badge>
              <Badge tone={y.openHand === "ok" ? "green" : "neutral"}>
                鳴き{y.openHand === "ok" ? "OK" : "NG"}
              </Badge>
            </div>
            <p className="text-xs text-ink-600">{y.description}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
