import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventDetail } from "@/lib/mahjong/queries";
import { GameResultForm } from "@/components/events/GameResultForm";
import { Card } from "@/components/ui/Card";

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default async function GameResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await getEventDetail(id);
  if (!event) notFound();
  if (event.organizerUserId !== user.id) redirect(`/events/${id}`);

  const pendingEntries = event.entries.filter((e) =>
    ["entered", "selected"].includes(e.status)
  );
  const playedEntries = event.entries.filter((e) => e.status === "played");
  const allTables = chunk(pendingEntries, 4);
  const tables = allTables.filter((t) => t.length === 4);
  const leftover = allTables.find((t) => t.length !== 4);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-ink-900">対局結果を記録する</h1>
        <p className="mt-1 text-sm text-ink-600">{event.title}</p>
      </div>

      {playedEntries.length > 0 && (
        <Card className="p-4">
          <p className="mb-1 text-xs font-semibold text-ink-400">記録済み</p>
          <p className="text-sm text-ink-900">
            {playedEntries.map((e) => e.user.name).join("、")}
          </p>
        </Card>
      )}

      {tables.length === 0 && !leftover && (
        <p className="py-10 text-center text-sm text-ink-400">
          すべての対局が記録済みです。
        </p>
      )}

      {leftover && (
        <p className="text-sm text-red-600">
          {leftover.length}人が4人に満たないため対局を記録できません。参加者調整を先に行ってください。
        </p>
      )}

      <div className="space-y-4">
        {tables.map((players, i) => (
          <GameResultForm
            key={players.map((p) => p.id).join(",")}
            eventId={id}
            tableNumber={i + 1}
            players={players.map((p) => ({
              entryId: p.id,
              userId: p.userId,
              userName: p.user.name,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
