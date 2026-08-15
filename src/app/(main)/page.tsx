import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listOpenEvents, listMyEvents } from "@/lib/mahjong/queries";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab === "joined" ? "joined" : "open";

  const openEvents = activeTab === "open" ? await listOpenEvents() : [];
  const myEvents = activeTab === "joined" ? await listMyEvents(user.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink-900">次の一局、誰と打つ？</h1>
          <p className="mt-0.5 text-sm text-ink-600">気になる卓に参加してみましょう</p>
        </div>
        <Link href="/events/new" className="shrink-0">
          <Button variant="secondary" className="whitespace-nowrap">
            ＋ 卓を立てる
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 rounded-full bg-ink-400/10 p-1 text-sm font-medium">
        <Link
          href="/?tab=open"
          className={`flex-1 rounded-full py-2 text-center transition-colors ${
            activeTab === "open" ? "bg-washi-100 text-board-800 shadow-sm" : "text-ink-600"
          }`}
        >
          募集中の卓
        </Link>
        <Link
          href="/?tab=joined"
          className={`flex-1 rounded-full py-2 text-center transition-colors ${
            activeTab === "joined" ? "bg-washi-100 text-board-800 shadow-sm" : "text-ink-600"
          }`}
        >
          参加中の卓
        </Link>
      </div>

      {activeTab === "open" && (
        <div className="space-y-3">
          {openEvents.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-400">
              現在募集中の卓はありません。最初の卓を立ててみませんか？
            </p>
          )}
          {openEvents.map(({ event, entryCount, formation }) => (
            <EventCard
              key={event.id}
              event={event}
              organizer={event.organizer}
              entryCount={entryCount}
              formation={formation}
            />
          ))}
        </div>
      )}

      {activeTab === "joined" && (
        <div className="space-y-3">
          {myEvents.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-400">
              まだ参加中の卓がありません。募集中の卓を見てみましょう。
            </p>
          )}
          {myEvents.map(({ event, entryCount, formation }) => (
            <EventCard
              key={event.id}
              event={event}
              organizer={event.organizer}
              entryCount={entryCount}
              formation={formation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
