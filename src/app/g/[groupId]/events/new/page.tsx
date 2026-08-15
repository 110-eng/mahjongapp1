import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { createEvent } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { TableCountStepper } from "@/components/events/TableCountStepper";
import { DecorativeDivider } from "@/components/ui/DecorativeDivider";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { user } = await requireMembership(groupId);

  const defaultEventDate = new Date();
  defaultEventDate.setDate(defaultEventDate.getDate() + 2);
  defaultEventDate.setHours(19, 0, 0, 0);

  const defaultDeadline = new Date(defaultEventDate);
  defaultDeadline.setDate(defaultDeadline.getDate() - 1);
  defaultDeadline.setHours(18, 0, 0, 0);

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-5 bg-board-800 px-4 pt-5 pb-6 text-washi-100">
        <div className="flex items-center justify-between">
          <Link href={`/g/${groupId}`} className="text-xl leading-none">
            ‹
          </Link>
          <h1 className="font-serif text-base font-bold tracking-wide">卓を立てる</h1>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-washi-100 text-lg">
            🀄
          </span>
        </div>
        <DecorativeDivider className="mt-3" />
      </div>

      <Card className="p-4">
        <form action={createEvent.bind(null, groupId)} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">開催タイトル</label>
            <input
              name="title"
              required
              placeholder="例) 8/20 夜麻雀"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">開催日時</label>
            <input
              type="datetime-local"
              name="eventDatetime"
              required
              defaultValue={toLocalInputValue(defaultEventDate)}
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">エントリー締切</label>
            <input
              type="datetime-local"
              name="entryDeadline"
              required
              defaultValue={toLocalInputValue(defaultDeadline)}
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">最大卓数</label>
            <TableCountStepper name="maxTables" defaultValue={2} />
          </div>

          <div className="border-t border-ink-400/10 pt-4">
            <Toggle
              name="beginnerFriendly"
              label="初心者歓迎"
              description="役や点数に自信がなくても参加OK！"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">メモ・補足</label>
            <textarea
              name="note"
              rows={3}
              placeholder="例) 20時半頃までの予定です"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </div>

          <p className="text-xs text-ink-400">
            募集者：{user.name}（あなた）
          </p>

          <Button type="submit" variant="primary" className="w-full gap-2">
            この内容で卓を立てる
            <span className="text-base">🀄</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
