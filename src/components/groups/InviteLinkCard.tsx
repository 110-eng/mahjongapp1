"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateInviteToken } from "@/app/groups/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function InviteLinkCard({
  groupId,
  inviteToken,
  isOwner,
}: {
  groupId: string;
  inviteToken: string;
  isOwner: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCopy = async () => {
    const url = `${window.location.origin}/invite/${inviteToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">メンバーを招待</h2>
        <p className="mt-1 text-xs text-ink-600">
          リンクをコピーしてTeams等へ共有してください。リンクを開いた人はログイン後、参加確認画面が表示されます。
        </p>
      </div>
      <Button variant="secondary" className="w-full" onClick={handleCopy}>
        {copied ? "コピーしました！" : "招待リンクをコピー"}
      </Button>
      {isOwner && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await regenerateInviteToken(groupId);
              router.refresh();
            })
          }
          className="w-full text-center text-xs text-ink-400 underline underline-offset-2 cursor-pointer"
        >
          {isPending ? "再発行中..." : "招待リンクを再発行する(古いリンクは無効になります)"}
        </button>
      )}
    </Card>
  );
}
