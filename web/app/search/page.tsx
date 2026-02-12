import Link from "next/link";
import Image from "next/image";
import { eq } from "drizzle-orm";
import { users } from "@septcode/db/schema";
import { TimelineFeed } from "@/components/TimelineFeed";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getTimelinePage } from "@/lib/queries";

type SearchPageSearchParams = {
  q?: string | string[];
};

export default async function SearchPage({ searchParams }: { searchParams?: SearchPageSearchParams }) {
  const userId = await getSessionUserId();
  const rawQ = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const query = String(rawQ ?? "").trim();

  const [me, searchResult] = await Promise.all([
    userId ? db.select().from(users).where(eq(users.id, userId)).limit(1) : Promise.resolve([]),
    query ? getTimelinePage({ tab: "for-you", userId, page: 1, limit: 20, query }) : Promise.resolve({ items: [], hasMore: false })
  ]);

  const myAvatarUrl = me[0]
    ? me[0].avatarUrl && me[0].avatarUrl.trim().length > 0
      ? me[0].avatarUrl
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(me[0].handle)}`
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="sticky top-0 z-20 overflow-hidden rounded-xl border border-slate-700 bg-panel/95 backdrop-blur">
        <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-end gap-2">
            <Image src="/logo.png" alt="SeptCode logo" width={36} height={36} className="mb-0.5 h-9 w-9 shrink-0" />
            <h1 className="min-w-0 truncate font-display text-3xl leading-none tracking-[0.04em] text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text sm:text-4xl sm:tracking-[0.06em]">
              SeptCode
            </h1>
            <span className="pb-1 text-[10px] font-semibold tracking-wide text-slate-300 sm:text-xs">検索</span>
          </div>
          {me[0] ? (
            <Link
              href={`/u/${me[0].id}`}
              className="inline-flex items-center gap-2 self-end rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500 sm:text-sm"
            >
              <img src={myAvatarUrl} alt={me[0].name} className="h-6 w-6 rounded-full border border-slate-700 bg-slate-800" />
              <span>@{me[0].handle}</span>
            </Link>
          ) : null}
        </div>
      </header>

      <section className="rounded-xl border border-slate-700 bg-panel/80 p-3 sm:p-4">
        <form action="/search" method="get" className="flex flex-col gap-2 sm:flex-row">
          <input type="text" name="q" defaultValue={query} placeholder="検索: keyword / tag:react / lang:typescript" className="w-full" maxLength={120} />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="h-10 w-20 whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950">
              検索
            </button>
            {query ? (
              <Link href="/search" className="inline-flex h-10 w-20 items-center justify-center whitespace-nowrap rounded-lg border border-slate-600 px-3 py-2 text-sm">
                クリア
              </Link>
            ) : null}
          </div>
        </form>
        <p className="mt-2 text-xs text-slate-400">`tag:xxx` でタグ、`lang:xxx` で言語、通常語は曖昧検索します。</p>
      </section>

      {query ? (
        <TimelineFeed
          initialItems={searchResult.items}
          initialHasMore={searchResult.hasMore}
          tab="for-you"
          query={query}
          canLike={Boolean(me[0])}
          viewerUserId={me[0]?.id ?? null}
          emptyMessage="条件に一致する投稿が見つかりません。"
        />
      ) : (
        <article className="rounded-xl border border-slate-700 bg-panel/70 p-5 text-sm text-slate-300">
          キーワードを入力して検索してください。例: `tag:react lang:ts useState`
        </article>
      )}
    </div>
  );
}
