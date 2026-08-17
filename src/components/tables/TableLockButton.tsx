"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockTable } from "@/app/g/[groupId]/tables/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function TableLockButton({ groupId, tableId }: { groupId: string; tableId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <Button variant="ghost" className="w-full" onClick={() => setConfirming(true)}>
        対局結果をロックする
      </Button>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold text-ink-900">対局結果をロックしますか？</p>
      <p className="text-xs text-ink-600">
        ロックすると、半荘の追加・編集・削除ができなくなります。この操作は元に戻せません。
      </p>
      <div className="space-y-2">
        <Button
          variant="primary"
          className="w-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await lockTable(groupId, tableId);
              router.refresh();
            })
          }
        >
          {isPending ? "ロック中..." : "対局結果をロックする"}
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
    </Card>
  );
}
