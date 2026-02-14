import { deleteOfficialPostAction, runOfficialAutoPostAction } from "@/app/actions";
import { env } from "@/lib/env";
import { getOfficialPostsForAdmin } from "@/lib/queries";

type OfficialPostsSearchParams = {
  status?: string;
  publicId?: string;
  language?: string;
  reason?: string;
  nextRunAt?: string;
  delete?: string;
};

export default async function OfficialPostsPage({ searchParams }: { searchParams?: OfficialPostsSearchParams }) {
  const posts = await getOfficialPostsForAdmin(30);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">運営公式投稿</h1>
        <p className="mt-1 text-sm text-subInk">管理画面から公式アカウントのAI投稿を実行し、cron連携で定期自動投稿できます。</p>
      </section>

      <StatusBanner searchParams={searchParams} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-panel p-4">
          <h2 className="text-lg font-semibold text-ink">手動実行</h2>
          <p className="mt-2 text-sm text-subInk">言語・ライブラリを指定して、7行以内の実用コード投稿をAI生成できます。</p>
          <form action={runOfficialAutoPostAction} className="mt-4 space-y-3">
            <input type="hidden" name="force" value="1" />
            <div className="grid gap-2">
              <label htmlFor="languagePrompt" className="text-xs font-semibold text-subInk">
                指定言語（任意）
              </label>
              <input
                id="languagePrompt"
                name="languagePrompt"
                maxLength={64}
                placeholder="例: TypeScript / Rust / Haskell"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="libraryPrompt" className="text-xs font-semibold text-subInk">
                指定ライブラリ（任意・カンマ区切り）
              </label>
              <input
                id="libraryPrompt"
                name="libraryPrompt"
                maxLength={160}
                placeholder="例: React, Prisma, pandas"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentHover">
                今すぐ自動投稿を実行
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-4">
          <h2 className="text-lg font-semibold text-ink">定期実行（cron）</h2>
          <dl className="mt-3 space-y-2 text-sm text-subInk">
            <div className="flex flex-col">
              <dt className="font-semibold text-ink">エンドポイント</dt>
              <dd className="font-mono">/api/cron/official-post</dd>
            </div>
            <div className="flex flex-col">
              <dt className="font-semibold text-ink">間隔</dt>
              <dd>{env.officialPostIntervalMinutes} 分ごと（間隔内は自動スキップ）</dd>
            </div>
            <div className="flex flex-col">
              <dt className="font-semibold text-ink">認証</dt>
              <dd>{env.officialPostCronSecret ? "有効（Bearer / x-cron-secret）" : "未設定（要 OFFICIAL_POST_CRON_SECRET）"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="font-semibold text-ink">投稿アカウント</dt>
              <dd>
                {env.officialPostName} (@{env.officialPostHandle})
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-xl border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">最新の公式投稿（Web表示プレビュー付き）</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-subInk">まだ公式投稿がありません。上の「今すぐ実行」を押してください。</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-subInk">
                    <span className="rounded border border-slate-300 px-2 py-0.5">{post.language}</span>
                    <span>{post.version ?? "latest"}</span>
                    <span>{post.lineCount} lines</span>
                    <span>likes: {post.likeCount}</span>
                    <span>comments: {post.commentCount}</span>
                    <span>{formatTimestamp(post.createdAt)}</span>
                    <span>publicId: {post.publicId}</span>
                  </div>
                  <form action={deleteOfficialPostAction}>
                    <input type="hidden" name="postPublicId" value={post.publicId} />
                    <button
                      type="submit"
                      className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      この投稿を削除
                    </button>
                  </form>
                </div>
                <p className="mb-3 whitespace-pre-line text-sm text-ink">{`${post.premise1}\n${post.premise2}`}</p>
                {post.tags.length > 0 ? (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {post.tags.map((tag) => (
                      <span key={`${post.id}-${tag}`} className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-subInk">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <iframe
                    title={`official-post-${post.publicId}`}
                    src={`${env.webAppUrl}/posts/${post.publicId}`}
                    loading="lazy"
                    className="h-[640px] w-full rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBanner({ searchParams }: { searchParams?: OfficialPostsSearchParams }) {
  const status = searchParams?.status;
  const deleteStatus = searchParams?.delete;

  if (deleteStatus === "success") {
    return <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">公式投稿を削除しました。</p>;
  }

  if (deleteStatus === "not_found") {
    return <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">削除対象の公式投稿が見つかりませんでした。</p>;
  }

  if (deleteStatus === "invalid_input") {
    return <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">削除リクエストの入力値が不正です。</p>;
  }

  if (!status) return null;

  if (status === "created") {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        公式投稿を作成しました。language: {searchParams?.language ?? "-"} / publicId: {searchParams?.publicId ?? "-"}
      </p>
    );
  }

  if (status === "skipped") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        間隔制御により投稿をスキップしました。nextRunAt: {searchParams?.nextRunAt ?? "-"}
      </p>
    );
  }

  if (status === "invalid_input") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        入力が不正です。言語は64文字以内、ライブラリ指定は160文字以内で入力してください。
      </p>
    );
  }

  return <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">公式投稿の実行に失敗しました。</p>;
}

function formatTimestamp(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "-";
  const parsed = value.includes("T") ? new Date(value) : new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
