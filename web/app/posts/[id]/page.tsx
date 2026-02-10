import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommentAction, toggleLikeAction } from "@/app/actions";
import { CodeRenderer } from "@/components/CodeRenderer";
import { getSessionUserId } from "@/lib/auth";
import { getPostDetail } from "@/lib/queries";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const post = await getPostDetail(params.id, userId);
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-300 hover:text-white">
        ← タイムラインへ戻る
      </Link>

      <article className="rounded-xl border border-slate-700 bg-panel/90 p-4">
        <h1 className="text-xl font-bold">@{post.authorHandle} の投稿</h1>
        <div className="mt-3">
          <CodeRenderer language={post.language} code={post.code} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-sky-300">{post.language}</span>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
            {post.version ?? "latest"}
          </span>
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-600 px-2 py-1 text-slate-300">
              #{tag}
            </span>
          ))}
        </div>

        <p className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-xs text-violet-200">
          AI: {post.aiSummary || "解説未生成"}
        </p>

        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
          <p className="whitespace-pre-line">{`${post.premise1}\n${post.premise2}`}</p>
        </div>

        <form action={toggleLikeAction} className="mt-3">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="postPublicId" value={post.publicId} />
          <button
            type="submit"
            disabled={!userId}
            className={`rounded-lg border px-3 py-1 text-sm ${
              post.likedByMe ? "border-pink-400 text-pink-300" : "border-slate-600 text-slate-200"
            } disabled:opacity-40`}
          >
            いいね {post.likeCount}
          </button>
        </form>
      </article>

      <section className="rounded-xl border border-slate-700 bg-panel/80 p-4">
        <h2 className="mb-3 text-lg font-semibold">コメント</h2>
        {userId ? (
          <form action={addCommentAction} className="mb-4 flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="postPublicId" value={post.publicId} />
            <input name="body" placeholder="コメントを入力" className="flex-1" required maxLength={240} />
            <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950">
              送信
            </button>
          </form>
        ) : (
          <p className="mb-3 text-sm text-slate-300">コメントにはログインが必要です。</p>
        )}

        <div className="space-y-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-sm text-slate-100">{comment.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {comment.userName} (@{comment.userHandle})
              </p>
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-sm text-slate-400">まだコメントはありません。</p>}
        </div>
      </section>
    </div>
  );
}
