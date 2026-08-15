import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Yaku } from "@/lib/mahjong/yaku";

export function YakuCard({ yaku }: { yaku: Yaku }) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-ink-900">{yaku.name}</h3>
        <Badge tone="gold">{yaku.han}</Badge>
        <Badge tone={yaku.openHand === "ok" ? "green" : "neutral"}>
          鳴き{yaku.openHand === "ok" ? "OK" : "NG"}
        </Badge>
      </div>
      <p className="text-sm text-ink-600">{yaku.description}</p>
      {yaku.example && (
        <p className="rounded-lg bg-washi-200 px-3 py-2 text-xs text-ink-600">{yaku.example}</p>
      )}
    </Card>
  );
}
