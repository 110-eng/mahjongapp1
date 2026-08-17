import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/login/actions";
import type { User } from "@/generated/prisma/client";

export function Header({
  user,
  groupName,
  groupId,
}: {
  user: User;
  groupName?: string;
  groupId?: string;
}) {
  return (
    <header className="sticky top-0 z-20 bg-board-800 text-washi-100 shadow-md">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <Link href={groupId ? `/g/${groupId}` : "/groups"} className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-400/60 shadow-sm">
            <Image
              src="/logo.png"
              alt={groupName ?? "聴牌"}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </span>
        </Link>
        <form action={logout} className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-washi-200/80 sm:inline">{user.name} さん</span>
          <button
            type="submit"
            className="rounded-full border border-washi-100/30 px-2.5 py-1 text-[11px] text-washi-200/80 hover:bg-washi-100/10 cursor-pointer"
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  );
}
