import { tileLabel, tileColorClass, type TileCode, type TileGroup } from "@/lib/mahjong/tiles";

export function MahjongTile({ code }: { code: TileCode }) {
  return (
    <span
      className={`inline-flex h-9 w-8 shrink-0 items-center justify-center rounded-md border border-gold-500/40 bg-washi-100 text-xs font-bold shadow-sm ${tileColorClass(code)}`}
    >
      {tileLabel(code)}
    </span>
  );
}

/** 面子ごとにグループ分けして横並び表示する(グループ間はやや広めの余白) */
export function MahjongTileExample({ groups }: { groups: TileGroup[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex gap-1">
          {group.map((code, ti) => (
            <MahjongTile key={ti} code={code} />
          ))}
        </div>
      ))}
    </div>
  );
}
