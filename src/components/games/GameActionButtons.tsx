"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmGame, voidGame, discardDraftGame } from "@/app/g/[groupId]/games/actions";
import { Button } from "@/components/ui/Button";

export function ConfirmGameButton({ groupId, gameId }: { groupId: string; gameId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await confirmGame(groupId, gameId);
        router.refresh();
      })}
    >
      {isPending ? "確定中..." : "この内容で結果を確定する"}
    </Button>
  );
}

export function DiscardDraftButton({ groupId, gameId }: { groupId: string; gameId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => discardDraftGame(groupId, gameId))}
    >
      {isPending ? "破棄中..." : "この下書きを破棄する"}
    </Button>
  );
}

export function VoidGameButton({ groupId, gameId }: { groupId: string; gameId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await voidGame(groupId, gameId);
        router.refresh();
      })}
    >
      {isPending ? "処理中..." : "この対局を無効にする"}
    </Button>
  );
}
