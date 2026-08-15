"use client";

import { useTransition } from "react";
import { enterEvent, cancelEntry } from "@/app/(main)/events/[id]/actions";
import { Button } from "@/components/ui/Button";

export function EntryActionButton({
  eventId,
  mode,
  disabled,
}: {
  eventId: string;
  mode: "enter" | "cancel";
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (mode === "enter") {
    return (
      <Button
        variant="secondary"
        className="w-full"
        disabled={disabled || isPending}
        onClick={() => startTransition(() => enterEvent(eventId))}
      >
        {isPending ? "処理中..." : "参加したい"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => cancelEntry(eventId))}
    >
      {disabled ? "対局済みです" : isPending ? "処理中..." : "参加をキャンセルする"}
    </Button>
  );
}
