import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction, toggleFollowAction } from "@/app/actions";
import { CodeRenderer } from "@/components/CodeRenderer";
import { getSessionUserId } from "@/lib/auth";
import { getProfileById } from "@/lib/queries";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const profileId = Number(params.id);
  if (!Number.isInteger(profileId) || profileId <= 0) notFound();

  const viewerId = await getSessionUserId();
  const profile = await getProfileById(profileId, viewerId);
  if (!profile) notFound();
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.handle)}`;

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-300 hover:text-white">
        ← タイムラインへ戻る
      </Link>

      <section className="rounded-xl border border-slate-700 bg-panel/80 p-4">
        <div className="flex items-start gap-3">
          <img src={avatarUrl} alt={profile.name} className="h-14 w-14 rounded-full border border-slate-700 bg-slate-800" />
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-slate-400">@{profile.handle}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300">{profile.bio || "自己紹介はまだありません。"}</p>

        <div className="mt-3 flex items-center gap-4 text-sm text-slate-300">
          <span>{profile.followerCount} followers</span>
          <span>{profile.followingCount} following</span>
        </div>

        {viewerId && viewerId !== profile.id && (
          <form action={toggleFollowAction} className="mt-3">
            <input type="hidden" name="intent" value="toggle_follow" />
            <input type="hidden" name="targetUserId" value={profile.id} />
            <button
              type="submit"
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                profile.isFollowing ? "border border-slate-600" : "bg-accent text-slate-950"
              }`}
            >
              {profile.isFollowing ? "フォロー中" : "フォローする"}
            </button>
          </form>
        )}

        {viewerId === profile.id && (
          <form action={logoutAction} className="mt-3">
            <input type="hidden" name="intent" value="logout" />
            <button type="submit" className="rounded-lg border border-slate-600 px-3 py-1 text-sm font-semibold hover:border-slate-300">
              ログアウト
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">投稿</h2>
        {profile.posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-slate-700 bg-panel/80 p-4">
            <p className="mb-2 whitespace-pre-line text-sm text-slate-300">{`${post.premise1}\n${post.premise2}`}</p>
            <CodeRenderer language={post.language} code={post.code} />
            <Link href={`/posts/${post.publicId}`} className="mt-2 inline-block text-xs text-accent2">
              詳細を見る
            </Link>
          </article>
        ))}
        {profile.posts.length === 0 && <p className="text-sm text-slate-400">投稿はまだありません。</p>}
      </section>
    </div>
  );
}
