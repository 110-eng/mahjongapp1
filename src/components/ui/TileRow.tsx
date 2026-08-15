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
              ? "flex h-9 w-7 items-center justify-center rounded-md border border-gold-600 bg-gradient-to-b from-washi-100 to-washi-200 text-base font-bold text-board-800 shadow-sm"
              : "flex h-9 w-7 items-center justify-center rounded-md border border-dashed border-ink-400/40 bg-transparent text-base text-ink-400"
          }
        >
          {tile.label}
        </span>
      ))}
    </div>
  );
}
