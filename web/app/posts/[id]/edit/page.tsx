import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updatePostAction } from "@/app/actions";
import { getSessionUserId } from "@/lib/auth";
import { getPostDetail } from "@/lib/queries";
import { DEFAULT_POST_ERROR_MESSAGE } from "@/lib/post-errors";

type PostEditSearchParams = {
  error?: string | string[];
  post_error?: string | string[];
};

export default async function PostEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: PostEditSearchParams;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const post = await getPostDetail(params.id, userId);
  if (!post) notFound();
  if (post.authorId !== userId) redirect(`/posts/${params.id}`);

  const rawError = Array.isArray(searchParams?.error) ? searchParams?.error[0] : searchParams?.error;
  const rawPostError = Array.isArray(searchParams?.post_error) ? searchParams?.post_error[0] : searchParams?.post_error;
  const postErrorMessage = rawPostError && rawPostError.trim().length > 0 ? rawPostError : DEFAULT_POST_ERROR_MESSAGE;
  const premiseText = [post.premise1, post.premise2].filter((line) => line.trim().length > 0).join("\n");

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-slate-700 bg-panel/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">投稿を編集</h1>
        <Link href={`/posts/${post.publicId}`} className="text-sm text-slate-300 hover:text-white">
          詳細へ戻る
        </Link>
      </div>

      {rawError === "invalid_post" && <p className="mb-3 text-sm text-rose-300">更新に失敗しました: {postErrorMessage}</p>}

      <form action={updatePostAction} className="space-y-3">
        <input type="hidden" name="intent" value="update_post" />
        <input type="hidden" name="postPublicId" value={post.publicId} />

        <textarea name="code" defaultValue={post.code} required rows={7} className="w-full font-mono" />

        <div className="grid gap-3 sm:grid-cols-3">
          <input name="language" defaultValue={post.language} placeholder="language (optional)" />
          <input name="version" defaultValue={post.version ?? ""} placeholder="version (optional)" />
          <input name="tags" defaultValue={post.tags.join(", ")} placeholder="tags (comma separated)" />
        </div>

        <div className="grid gap-2">
          <textarea
            name="premiseText"
            defaultValue={premiseText}
            placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
            rows={3}
            className="w-full resize-y"
          />
          <p className="text-xs text-slate-400">前提文は任意入力です（最大2行、各140文字以内）。</p>
        </div>

        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
          更新する
        </button>
      </form>
    </section>
  );
}
