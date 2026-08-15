import { prisma } from "@/lib/prisma";
import { selectUser, createUser } from "./actions";
import { EXPERIENCE_LABELS } from "@/lib/mahjong/experience";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-dvh bg-board-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center text-washi-100">
          <p className="text-3xl">🀄️</p>
          <h1 className="mt-2 text-xl font-bold tracking-wide">あつまれ麻雀部</h1>
          <p className="mt-1 text-sm text-washi-200/70">あなたの名前を選んでください</p>
        </div>

        <Card className="p-4">
          <div className="space-y-2">
            {users.length === 0 && (
              <p className="text-sm text-ink-600">
                まだメンバーが登録されていません。下のフォームから最初のメンバーを登録してください。
              </p>
            )}
            {users.map((u) => (
              <form key={u.id} action={selectUser.bind(null, u.id)}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-xl border border-gold-400/30 px-4 py-3 text-left hover:bg-gold-500/10 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-ink-900">{u.name}</span>
                  <span className="text-xs text-ink-600">
                    {EXPERIENCE_LABELS[u.experienceLevel]}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-ink-900">はじめての方はこちら</p>
          <form action={createUser} className="space-y-3">
            <input
              name="name"
              required
              placeholder="お名前"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
            <select
              name="experienceLevel"
              defaultValue="beginner"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="inexperienced">未経験</option>
              <option value="beginner">初心者</option>
              <option value="experienced">経験者</option>
            </select>
            <Button type="submit" variant="secondary" className="w-full">
              登録して始める
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
