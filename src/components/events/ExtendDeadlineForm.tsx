"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { extendDeadline } from "@/app/(main)/events/[id]/actions";
import { Button } from "@/components/ui/Button";

export function ExtendDeadlineForm({ eventId }: { eventId: string }) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2 rounded-xl border border-gold-400/30 p-3">
      <label className="block text-sm font-medium text-ink-900">新しい締切日時</label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      <Button
        variant="ghost"
        className="w-full"
        disabled={!value || isPending}
        onClick={() =>
          startTransition(async () => {
            await extendDeadline(eventId, value);
            router.push(`/events/${eventId}`);
          })
        }
      >
        {isPending ? "更新中..." : "締切を延長する"}
      </Button>
    </div>
  );
}
