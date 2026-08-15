import Link from "next/link";
import { logout } from "@/app/login/actions";
import type { User } from "@/generated/prisma/client";

export function Header({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-20 bg-board-800 text-washi-100 shadow-md">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🀄️</span>
          <span className="text-base font-bold tracking-wide">あつまれ麻雀部</span>
        </Link>
        <form action={logout} className="flex items-center gap-2">
          <span className="text-xs text-washi-200/80">{user.name} さん</span>
          <button
            type="submit"
            className="rounded-full border border-washi-100/30 px-2.5 py-1 text-[11px] text-washi-200/80 hover:bg-washi-100/10 cursor-pointer"
          >
            切替
          </button>
        </form>
      </div>
    </header>
  );
}
