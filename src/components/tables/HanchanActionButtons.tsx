"use client";

import { useState, useTransition } from "react";
import { deleteHanchan } from "@/app/g/[groupId]/tables/actions";
import { Button } from "@/components/ui/Button";

export function DeleteHanchanButton({
  groupId,
  tableId,
  gameId,
}: {
  groupId: string;
  tableId: string;
  gameId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" className="w-full" onClick={() => setConfirming(true)}>
        この半荘を削除する
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-red-600">この半荘を削除します。この操作は元に戻せません。</p>
      <Button
        variant="ghost"
        className="w-full text-red-600"
        disabled={isPending}
        onClick={() => startTransition(() => deleteHanchan(groupId, tableId, gameId))}
      >
        {isPending ? "削除中..." : "削除する"}
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        キャンセル
      </Button>
    </div>
  );
}
