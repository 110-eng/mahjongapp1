import { FEATURED_YAKU } from "@/lib/mahjong/yaku";
import { YakuCard } from "@/components/learn/YakuCard";
import { YakuFilterList } from "@/components/learn/YakuFilterList";

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-ink-900">🔰 まず覚えたい役</h1>
        <p className="mt-1 text-sm text-ink-600">
          対局中に分からなくなったら、いつでもここで確認できます。
        </p>
      </div>

      <div className="space-y-3">
        {FEATURED_YAKU.map((y) => (
          <YakuCard key={y.key} yaku={y} />
        ))}
      </div>

      <div id="all" className="space-y-3 border-t border-ink-400/10 pt-6">
        <h2 className="text-base font-bold text-ink-900">すべての役を見る</h2>
        <YakuFilterList />
      </div>
    </div>
  );
}
