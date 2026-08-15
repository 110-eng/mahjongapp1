import { createEvent } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function NewEventPage() {
  const defaultEventDate = new Date();
  defaultEventDate.setDate(defaultEventDate.getDate() + 2);
  defaultEventDate.setHours(19, 0, 0, 0);

  const defaultDeadline = new Date(defaultEventDate);
  defaultDeadline.setDate(defaultDeadline.getDate() - 1);
  defaultDeadline.setHours(18, 0, 0, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink-900">卓を立てる</h1>

      <Card className="p-4">
        <form action={createEvent} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">開催タイトル</label>
            <input
              name="title"
              required
              placeholder="例: 8/20 夜麻雀"
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
            <select
              name="maxTables"
              defaultValue="2"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}卓 (最大{n * 4}人)
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-900">
            <input type="checkbox" name="beginnerFriendly" className="h-4 w-4 accent-gold-500" />
            初心者歓迎にする
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">メモ・補足</label>
            <textarea
              name="note"
              rows={3}
              placeholder="例: 20時半頃までの予定です"
              className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full">
            卓を立てる
          </Button>
        </form>
      </Card>
    </div>
  );
}
