import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateGroupRule } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  await requireOwner(groupId);

  const rule = await prisma.groupRule.findUnique({ where: { groupId } });
  if (!rule) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-lg font-bold text-ink-900">麻雀ルール設定</h1>
        <p className="mt-1 text-sm text-ink-600">
          ここで設定した内容は、以後に作成される対局にのみ適用されます。過去の対局結果は変わりません。
        </p>
      </div>

      <Card className="p-4">
        <form action={updateGroupRule.bind(null, groupId)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">持ち点</label>
              <input
                type="number"
                name="startingPoints"
                step={100}
                defaultValue={rule.startingPoints}
                className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">返し点</label>
              <input
                type="number"
                name="returnPoints"
                step={100}
                defaultValue={rule.returnPoints}
                className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">ウマ</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: "umaFirst", label: "1位", value: rule.umaFirst },
                { name: "umaSecond", label: "2位", value: rule.umaSecond },
                { name: "umaThird", label: "3位", value: rule.umaThird },
                { name: "umaFourth", label: "4位", value: rule.umaFourth },
              ].map((u) => (
                <div key={u.name}>
                  <span className="mb-1 block text-center text-xs text-ink-400">{u.label}</span>
                  <input
                    type="number"
                    name={u.name}
                    defaultValue={u.value}
                    className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-2 py-2 text-center text-sm outline-none focus:border-gold-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-ink-400/10 pt-4">
            <Toggle
              name="chipEnabled"
              label="チップ"
              description="ON/OFFを切り替えます"
              defaultChecked={rule.chipEnabled}
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-ink-600">1枚あたり</span>
              <input
                type="number"
                name="chipValue"
                defaultValue={rule.chipValue}
                className="w-24 rounded-lg border border-ink-400/30 bg-washi-100 px-2 py-1.5 text-center text-sm outline-none focus:border-gold-500"
              />
              <span className="text-sm text-ink-600">pt</span>
            </div>
          </div>

          <details className="rounded-xl border border-ink-400/15 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-board-800">
              詳細ルール
            </summary>
            <div className="mt-4 space-y-4">
              <Toggle
                name="okaEnabled"
                label="オカ"
                description="返し点と持ち点の差を1位に加算します"
                defaultChecked={rule.okaEnabled}
              />

              <div className="space-y-3 border-t border-ink-400/10 pt-3">
                <p className="text-xs text-ink-400">
                  チップが発生する状況(記録は対局ごとに手入力します)
                </p>
                <Toggle
                  name="redDoraChipEnabled"
                  label="赤ドラチップ"
                  defaultChecked={rule.redDoraChipEnabled}
                />
                <Toggle
                  name="ippatsuChipEnabled"
                  label="一発チップ"
                  defaultChecked={rule.ippatsuChipEnabled}
                />
                <Toggle
                  name="uraDoraChipEnabled"
                  label="裏ドラチップ"
                  defaultChecked={rule.uraDoraChipEnabled}
                />
              </div>

              <div className="space-y-3 border-t border-ink-400/10 pt-3">
                <Toggle
                  name="bustPenaltyEnabled"
                  label="飛びペナルティ"
                  description="持ち点がマイナスになった場合に減点します"
                  defaultChecked={rule.bustPenaltyEnabled}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-600">ペナルティ点</span>
                  <input
                    type="number"
                    name="bustPenaltyValue"
                    defaultValue={rule.bustPenaltyValue}
                    className="w-24 rounded-lg border border-ink-400/30 bg-washi-100 px-2 py-1.5 text-center text-sm outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="border-t border-ink-400/10 pt-3">
                <Toggle
                  name="yakitoriEnabled"
                  label="焼き鳥"
                  description="ルールとして記録しますが、精算は対局外で行ってください"
                  defaultChecked={rule.yakitoriEnabled}
                />
              </div>

              <div className="border-t border-ink-400/10 pt-3">
                <label className="mb-1 block text-sm font-medium text-ink-900">端数処理</label>
                <select
                  name="roundingRule"
                  defaultValue={rule.roundingRule}
                  className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
                >
                  <option value="round">四捨五入</option>
                  <option value="floor">切り捨て</option>
                  <option value="ceil">切り上げ</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">同点時の順位</label>
                <select
                  name="tieRule"
                  defaultValue={rule.tieRule}
                  className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
                >
                  <option value="seat_order">起家からの順で決める</option>
                  <option value="shared_rank">同着として順位を分け合う</option>
                </select>
              </div>
            </div>
          </details>

          <Button type="submit" variant="secondary" className="w-full">
            保存する
          </Button>
        </form>
      </Card>
    </div>
  );
}
