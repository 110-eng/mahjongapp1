import type { Tile } from "@/lib/mahjong/tableFormation";

export function TileRow({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="img" aria-label="卓成立状況">
      {tiles.map((tile, i) => (
        <span
          key={i}
          aria-hidden
          className={
            tile.filled
              ? "flex h-10 w-8 items-center justify-center rounded-md border border-gold-500/50 bg-washi-100 text-base font-bold text-board-800 shadow-[0_1px_2px_rgba(13,43,34,0.15)]"
              : "flex h-10 w-8 items-center justify-center rounded-md border border-ink-400/25 bg-washi-200/60 text-sm text-ink-400/60"
          }
        >
          {tile.label}
        </span>
      ))}
    </div>
  );
}
