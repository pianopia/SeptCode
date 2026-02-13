"use client";

import { useMemo, useState } from "react";
import { updatePostAction } from "@/app/actions";
import { PostCodeTextarea } from "@/components/PostCodeTextarea";

export function PostEditForm({
  postPublicId,
  initialCode,
  initialLanguage,
  initialVersion,
  initialTags,
  initialPremiseText
}: {
  postPublicId: string;
  initialCode: string;
  initialLanguage: string;
  initialVersion: string;
  initialTags: string;
  initialPremiseText: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const lineCount = useMemo(() => (code.length ? code.split("\n").length : 1), [code]);
  const overLimit = lineCount > 7;

  return (
    <form action={updatePostAction} className="space-y-3">
      <input type="hidden" name="intent" value="update_post" />
      <input type="hidden" name="postPublicId" value={postPublicId} />

      <PostCodeTextarea
        name="code"
        value={code}
        onValueChange={setCode}
        language={language}
        required
        rows={7}
        className="w-full"
      />
      <p className="text-xs text-slate-400">コードは最大7行、各行200文字以内で入力してください。</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <input name="language" value={language} onChange={(e) => setLanguage(e.currentTarget.value)} placeholder="language (optional)" />
        <input name="version" defaultValue={initialVersion} placeholder="version (optional)" />
        <input name="tags" defaultValue={initialTags} placeholder="tags (comma separated)" />
      </div>

      <div className="grid gap-2">
        <textarea
          name="premiseText"
          defaultValue={initialPremiseText}
          placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
          rows={3}
          className="w-full resize-y"
        />
        <p className="text-xs text-slate-400">前提文は任意入力です（最大2行、各140文字以内）。</p>
      </div>

      <button
        type="submit"
        disabled={overLimit}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        更新する
      </button>
    </form>
  );
}
