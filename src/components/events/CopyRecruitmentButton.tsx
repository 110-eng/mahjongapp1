"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import type { Event } from "@/generated/prisma/client";

export function CopyRecruitmentButton({ event }: { event: Event }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    const lines = [
      `🀄️ ${event.title}`,
      "",
      `開催: ${formatDateTime(event.eventDatetime)}`,
      `締切: ${formatDateTime(event.entryDeadline)}`,
      `最大卓数: ${event.maxTables}`,
      `初心者歓迎: ${event.beginnerFriendly ? "ON" : "OFF"}`,
      ...(event.note ? [`メモ: ${event.note}`] : []),
      "",
      "参加はこちらから👇",
      url,
    ];

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" className="w-full" onClick={handleCopy}>
      {copied ? "コピーしました！" : "募集内容をコピー"}
    </Button>
  );
}
