import { getDashboardSummary } from "@/lib/queries";

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">ダッシュボード</h1>
        <p className="mt-1 text-sm text-subInk">api / web / native-app を横断した運用状況を確認します。</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={summary.counts.users} />
        <StatCard label="Posts" value={summary.counts.posts} />
        <StatCard label="Tags" value={summary.counts.tags} />
        <StatCard label="Comments" value={summary.counts.comments} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <h2 className="text-lg font-semibold text-ink">直近ユーザー</h2>
          <ul className="mt-3 space-y-2">
            {summary.recentUsers.map((user) => (
              <li key={user.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <p className="font-semibold text-ink">{user.name}</p>
                <p className="text-subInk">@{user.handle}</p>
                <p className="text-xs text-slate-500">{user.createdAt}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <h2 className="text-lg font-semibold text-ink">直近投稿</h2>
          <ul className="mt-3 space-y-2">
            {summary.recentPosts.map((post) => (
              <li key={post.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <p className="font-semibold text-ink">{post.language}</p>
                <p className="text-subInk">publicId: {post.publicId}</p>
                <p className="text-xs text-slate-500">{post.createdAt}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs font-semibold tracking-[0.16em] text-subInk">{label.toUpperCase()}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value.toLocaleString()}</p>
    </article>
  );
}
