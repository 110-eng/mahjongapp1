import Link from "next/link";
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
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold-400/60 bg-washi-100 text-lg shadow-sm">
            🀄
          </span>
          <span className="truncate font-serif text-base font-bold tracking-wide">
            {groupName ?? "あつまれ麻雀部"}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {groupId && (
            <Link
              href={`/g/${groupId}/members`}
              className="rounded-full border border-washi-100/30 px-2.5 py-1 text-[11px] text-washi-200/80 hover:bg-washi-100/10"
            >
              メンバー
            </Link>
          )}
          <Link
            href="/groups"
            className="hidden rounded-full border border-washi-100/30 px-2.5 py-1 text-[11px] text-washi-200/80 hover:bg-washi-100/10 sm:inline-block"
          >
            麻雀部を切替
          </Link>
          <form action={logout} className="flex items-center gap-2">
            <span className="hidden text-xs text-washi-200/80 sm:inline">{user.name} さん</span>
            <button
              type="submit"
              className="rounded-full border border-washi-100/30 px-2.5 py-1 text-[11px] text-washi-200/80 hover:bg-washi-100/10 cursor-pointer"
            >
              切替
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
