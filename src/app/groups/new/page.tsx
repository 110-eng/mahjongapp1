import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createGroup } from "@/app/groups/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default async function NewGroupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-board-900 px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center text-washi-100">
          <h1 className="font-serif text-xl font-bold tracking-wide">麻雀部を作る</h1>
          <p className="mt-1 text-sm text-washi-200/70">
            まず基本情報だけ決めましょう。あとから変更できます。
          </p>
        </div>

        <Card className="p-4">
          <form action={createGroup} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">麻雀部の名前</label>
              <input
                name="name"
                required
                placeholder="例) Timewitch麻雀部"
                className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">
                年間シーズン開始月
              </label>
              <select
                name="seasonStartMonth"
                defaultValue={9}
                className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}月始まり
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-400">
                例: 9月始まりなら 9月〜翌8月が1シーズンになります。
              </p>
            </div>

            <Button type="submit" variant="secondary" className="w-full">
              この内容で作成する
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
