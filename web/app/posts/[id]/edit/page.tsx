import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PostEditForm } from "@/components/PostEditForm";
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

      <PostEditForm
        postPublicId={post.publicId}
        initialCode={post.code}
        initialLanguage={post.language}
        initialVersion={post.version ?? ""}
        initialTags={post.tags.join(", ")}
        initialPremiseText={premiseText}
      />
    </section>
  );
}
