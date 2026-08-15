"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/learn", label: "役一覧", icon: "📖" },
  { href: "/ranking", label: "ランキング", icon: "🏆" },
  { href: "/mypage", label: "マイページ", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-gold-500/20 bg-washi-100/95 backdrop-blur supports-[backdrop-filter]:bg-washi-100/80">
      <div className="mx-auto flex w-full max-w-xl">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-board-800 font-semibold" : "text-ink-400"
              }`}
            >
              <span className={`text-lg ${active ? "" : "opacity-60"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
