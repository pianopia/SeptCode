import Link from "next/link";
import Image from "next/image";
import { ComposeFab } from "@/components/ComposeFab";
import { TimelineFeed } from "@/components/TimelineFeed";
import { users } from "@septcode/db/schema";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { DEFAULT_POST_ERROR_MESSAGE } from "@/lib/post-errors";
import { getComposerSuggestions, getTimelinePage } from "@/lib/queries";
import { eq } from "drizzle-orm";

type HomeSearchParams = {
  tab?: string | string[];
  error?: string | string[];
  post_error?: string | string[];
};

export default async function HomePage({ searchParams }: { searchParams?: HomeSearchParams }) {
  const userId = await getSessionUserId();
  const rawTab = Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab;
  const rawError = Array.isArray(searchParams?.error) ? searchParams?.error[0] : searchParams?.error;
  const rawPostError = Array.isArray(searchParams?.post_error) ? searchParams?.post_error[0] : searchParams?.post_error;
  const tab = rawTab === "following" ? "following" : "for-you";
  const postErrorMessage = rawPostError && rawPostError.trim().length > 0 ? rawPostError : DEFAULT_POST_ERROR_MESSAGE;

  const [forYouPage, followingPage, me, suggestions] = await Promise.all([
    getTimelinePage({ tab: "for-you", userId, page: 1, limit: 20 }),
    userId ? getTimelinePage({ tab: "following", userId, page: 1, limit: 20 }) : Promise.resolve({ items: [], hasMore: false }),
    userId ? db.select().from(users).where(eq(users.id, userId)).limit(1) : Promise.resolve([]),
    getComposerSuggestions()
  ]);

  const effectiveTab: "for-you" | "following" = tab === "following" && me[0] ? "following" : "for-you";
  const activePage = effectiveTab === "following" ? followingPage : forYouPage;
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
            <span className="pb-1 text-[10px] font-semibold tracking-wide text-slate-300 sm:text-xs">-7行のコード共有-</span>
          </div>
          {me[0] ? (
            <div className="flex items-center justify-between gap-2 text-xs sm:justify-end sm:text-sm">
              <Link
                href={`/u/${me[0].id}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1 text-slate-200 hover:border-slate-500"
              >
                <img src={myAvatarUrl} alt={me[0].name} className="h-6 w-6 rounded-full border border-slate-700 bg-slate-800" />
                <span className="max-w-[38vw] truncate sm:max-w-none">@{me[0].handle}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 text-xs sm:text-sm">
              <Link href="/login" className="rounded-full bg-accent px-2.5 py-1 font-semibold text-slate-950 sm:px-3">
                ログイン
              </Link>
              <Link href="/register" className="rounded-full border border-slate-600 px-2.5 py-1 sm:px-3">
                新規登録
              </Link>
            </div>
          )}
        </div>

      </header>

      {me[0] && effectiveTab === "following" && (
        <article className="rounded-xl border border-slate-700 bg-panel/70 px-4 py-3 text-xs text-slate-300 sm:text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">フォロー中ユーザーの新着投稿を表示中。投稿は右下の「＋」からできます。</span>
            <Link href="/?tab=for-you" className="shrink-0 rounded-full border border-slate-600 px-2.5 py-1 text-xs hover:border-slate-300">
              おすすめへ
            </Link>
          </div>
        </article>
      )}

      {rawError === "invalid_post" && (
        <article className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          投稿に失敗しました: {postErrorMessage}
        </article>
      )}

      <TimelineFeed
        initialItems={activePage.items}
        initialHasMore={activePage.hasMore}
        tab={effectiveTab}
        query=""
        canLike={Boolean(me[0])}
        viewerUserId={me[0]?.id ?? null}
        returnTo={effectiveTab === "following" ? "/?tab=following" : "/"}
        emptyMessage={
          effectiveTab === "following"
            ? "まだフォロー中ユーザーの投稿がありません。ユーザープロフィールからフォローしてみてください。"
            : "おすすめ投稿はまだありません。最初の投稿を待っています。"
        }
      />

      {!me[0] && (
        <article className="rounded-xl border border-slate-700 bg-panel/70 p-4 text-sm text-slate-300">
          ログインすると投稿・いいね・コメント・フォロー中タブが使えます。
        </article>
      )}

      {me[0] && <ComposeFab suggestions={suggestions} />}
    </div>
  );
}
