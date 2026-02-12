"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Search, User, Users } from "lucide-react";

function tabClass(active: boolean) {
  return `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition ${
    active ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
  }`;
}

export function BottomTabs({ userId }: { userId: number | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const searchQuery = String(searchParams.get("q") ?? "").trim();

  const isSearch = pathname === "/search";
  const isFollowing = pathname === "/" && currentTab === "following";
  const isHome = pathname === "/" && !isFollowing;
  const isMe = userId !== null && pathname === `/u/${userId}`;
  const searchHref = searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : "/search";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-[#0d1117]/95 backdrop-blur">
      <div className={`mx-auto grid h-16 w-full max-w-5xl px-2 ${userId ? "grid-cols-4" : "grid-cols-3"}`}>
        <Link href="/?tab=for-you" className={tabClass(isHome)} aria-label="ホーム">
          <Home className="h-5 w-5" />
          <span>ホーム</span>
        </Link>
        <Link href={searchHref} className={tabClass(isSearch)} aria-label="検索">
          <Search className="h-5 w-5" />
          <span>検索</span>
        </Link>
        <Link href="/?tab=following" className={tabClass(isFollowing)} aria-label="フォロー中">
          <Users className="h-5 w-5" />
          <span>フォロー中</span>
        </Link>
        {userId ? (
          <Link href={`/u/${userId}`} className={tabClass(isMe)} aria-label="マイページ">
            <User className="h-5 w-5" />
            <span>マイページ</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
