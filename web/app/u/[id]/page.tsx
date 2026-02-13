import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction, toggleFollowAction, updateProfileAction } from "@/app/actions";
import { PostCard } from "@/components/PostCard";
import { getSessionUserId } from "@/lib/auth";
import { getProfileById } from "@/lib/queries";

type UserProfileSearchParams = {
  error?: string | string[];
  edit?: string | string[];
};

export default async function UserProfilePage({ params, searchParams }: { params: { id: string }; searchParams?: UserProfileSearchParams }) {
  const profileId = Number(params.id);
  if (!Number.isInteger(profileId) || profileId <= 0) notFound();

  const viewerId = await getSessionUserId();
  const profile = await getProfileById(profileId, viewerId);
  if (!profile) notFound();
  const rawError = Array.isArray(searchParams?.error) ? searchParams?.error[0] : searchParams?.error;
  const rawEdit = Array.isArray(searchParams?.edit) ? searchParams?.edit[0] : searchParams?.edit;
  const isEditMode = rawEdit === "1";
  const avatarUrl =
    profile.avatarUrl && profile.avatarUrl.trim().length > 0
      ? profile.avatarUrl
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.handle)}`;

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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {profile.profileLanguages.length > 0 ? (
            profile.profileLanguages.map((lang: string) => (
              <span key={lang} className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200">
                {lang}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">扱う言語は未設定です。</span>
          )}
        </div>

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

        {viewerId === profile.id && isEditMode && (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <h2 className="text-sm font-semibold text-slate-200">プロフィール編集</h2>
            {rawError === "invalid_profile" && (
              <p className="text-xs text-rose-300">
                プロフィールの入力内容が不正です。名前は1〜40文字、自己紹介は300文字以内、扱う言語は200文字以内にしてください。
              </p>
            )}
            {rawError === "invalid_avatar" && (
              <p className="text-xs text-rose-300">アイコン画像のアップロードに失敗しました。jpg/png/webp/gif（5MB以内）を指定してください。</p>
            )}

            <form action={updateProfileAction} className="space-y-2" encType="multipart/form-data">
              <input type="hidden" name="intent" value="update_profile" />
              <div>
                <label className="mb-1 block text-xs text-slate-300">表示名</label>
                <input name="name" defaultValue={profile.name} maxLength={40} required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-300">自己紹介</label>
                <textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={300} className="w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-300">扱う言語（カンマ区切り）</label>
                <input
                  name="profileLanguages"
                  defaultValue={(profile.profileLanguages ?? []).join(", ")}
                  maxLength={200}
                  placeholder="TypeScript, Rust, Python"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-300">アイコン画像（Cloud Storage）</label>
                <input type="file" name="avatar" accept="image/png,image/jpeg,image/webp,image/gif" />
              </div>
              <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-slate-950">
                保存する
              </button>
            </form>

            <Link href={`/u/${profile.id}`} className="inline-flex rounded-lg border border-slate-600 px-3 py-1 text-sm font-semibold hover:border-slate-300">
              キャンセル
            </Link>
          </div>
        )}

        {viewerId === profile.id && !isEditMode && (
          <div className="mt-3 flex items-center gap-2">
            <Link href={`/u/${profile.id}?edit=1`} className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-slate-950">
              編集する
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="intent" value="logout" />
              <button type="submit" className="rounded-lg border border-slate-600 px-3 py-1 text-sm font-semibold hover:border-slate-300">
                ログアウト
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">投稿</h2>
        {profile.posts.map((post) => (
          <PostCard key={`${post.publicId}-${post.id}`} post={post} canLike={Boolean(viewerId)} viewerUserId={viewerId} />
        ))}
        {profile.posts.length === 0 && <p className="text-sm text-slate-400">投稿はまだありません。</p>}
      </section>
    </div>
  );
}
