"use client";

import { useState } from "react";

export function TableCountStepper({
  name,
  defaultValue = 2,
  min = 1,
  max = 4,
}: {
  name: string;
  defaultValue?: number;
  min?: number;
  max?: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setValue((v) => Math.max(min, v - 1))}
          disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-400/30 text-lg font-bold text-board-800 disabled:opacity-30 cursor-pointer"
        >
          −
        </button>
        <span className="w-10 text-center text-lg font-bold text-ink-900">{value}</span>
        <button
          type="button"
          onClick={() => setValue((v) => Math.min(max, v + 1))}
          disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-400/30 text-lg font-bold text-board-800 disabled:opacity-30 cursor-pointer"
        >
          ＋
        </button>
        <input type="hidden" name={name} value={value} />
        <p className="text-xs text-ink-400">最大{value * 4}人まで参加できます(1卓4人)</p>
      </div>
    </div>
  );
}
