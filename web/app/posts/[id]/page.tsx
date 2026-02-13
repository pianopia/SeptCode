import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommentAction, deleteCommentAction, toggleLikeAction } from "@/app/actions";
import { CodeRenderer } from "@/components/CodeRenderer";
import { PostOwnerMenu } from "@/components/PostOwnerMenu";
import { getSessionUserId } from "@/lib/auth";
import { getPostDetail } from "@/lib/queries";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPostDetail(params.id);
  if (!post) {
    return {
      title: "投稿が見つかりません | SeptCode",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const siteUrl = getSiteUrl();
  const description = [post.premise1, post.premise2].filter(Boolean).join(" ").slice(0, 140);
  const url = `${siteUrl}/posts/${post.publicId}`;
  const title = `${post.authorHandle} の投稿 | SeptCode`;

  return {
    title,
    description,
    alternates: {
      canonical: `/posts/${post.publicId}`
    },
    robots: {
      index: true,
      follow: true
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "SeptCode"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function PostDetailPage({
  params
}: {
  params: { id: string };
}) {
  const userId = await getSessionUserId();
  const post = await getPostDetail(params.id, userId);
  if (!post) notFound();
  const isOwner = userId !== null && userId === post.authorId;

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-300 hover:text-white">
        ← タイムラインへ戻る
      </Link>

      <article className="rounded-xl border border-slate-700 bg-panel/90 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold">
            <Link href={`/u/${post.authorId}`} className="hover:text-accent2">
              @{post.authorHandle}
            </Link>{" "}
            の投稿
          </h1>
          {isOwner ? <PostOwnerMenu postPublicId={post.publicId} /> : null}
        </div>
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
          <input type="hidden" name="intent" value="toggle_like" />
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="postPublicId" value={post.publicId} />
          <button
            type="submit"
            disabled={!userId}
            className={`rounded-lg border px-3 py-1 text-sm ${post.likedByMe ? "border-pink-400 text-pink-300" : "border-slate-600 text-slate-200"
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
            <input type="hidden" name="intent" value="add_comment" />
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
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  {comment.userName} (@{comment.userHandle})
                </p>
                {userId && comment.userId === userId ? (
                  <form action={deleteCommentAction}>
                    <input type="hidden" name="intent" value="delete_comment" />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="postPublicId" value={post.publicId} />
                    <button type="submit" className="text-xs text-rose-300 hover:text-rose-200">
                      削除する
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-sm text-slate-400">まだコメントはありません。</p>}
        </div>
      </section>
    </div>
  );
}
