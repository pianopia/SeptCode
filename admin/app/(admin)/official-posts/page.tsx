import { runOfficialAutoPostAction } from "@/app/actions";
import { env } from "@/lib/env";
import { getOfficialPostsForAdmin } from "@/lib/queries";

type OfficialPostsSearchParams = {
  status?: string;
  publicId?: string;
  language?: string;
  reason?: string;
  nextRunAt?: string;
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
          <p className="mt-2 text-sm text-subInk">「今すぐ実行」で7行以内の実用コードをAI生成して投稿します。</p>
          <form action={runOfficialAutoPostAction} className="mt-4 flex items-center gap-2">
            <input type="hidden" name="force" value="1" />
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentHover">
              今すぐ自動投稿を実行
            </button>
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
        <h2 className="text-lg font-semibold text-ink">最新の公式投稿</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-subInk">まだ公式投稿がありません。上の「今すぐ実行」を押してください。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-slate-100 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-subInk">
                  <span className="rounded border border-slate-300 px-2 py-0.5">{post.language}</span>
                  <span>{post.version ?? "latest"}</span>
                  <span>{post.lineCount} lines</span>
                  <span>publicId: {post.publicId}</span>
                  <span>{post.createdAt}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-ink">{`${post.premise1}\n${post.premise2}`}</p>
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

  return <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">公式投稿の実行に失敗しました。</p>;
}
