"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { createPostAction } from "@/app/actions";
import { PostCodeTextarea } from "@/components/PostCodeTextarea";
import { COMPOSER_MASTER } from "@septcode/db/composer-master";

type ComposerSuggestions = {
  languages: string[];
  versions: string[];
  tags: string[];
};

const DEFAULT_SUGGESTIONS: ComposerSuggestions = {
  languages: [...COMPOSER_MASTER.languages],
  versions: [...COMPOSER_MASTER.versions],
  tags: [...COMPOSER_MASTER.tags]
};

export function PostComposer({
  compact = false,
  suggestions
}: {
  compact?: boolean;
  suggestions?: ComposerSuggestions;
}) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const lineCount = useMemo(() => (code.length ? code.split("\n").length : 1), [code]);
  const overLimit = lineCount > 7;
  const items = suggestions ?? DEFAULT_SUGGESTIONS;

  return (
    <section className={compact ? "" : "rounded-xl border border-slate-700 bg-panel/80 p-4"}>
      {!compact && <h2 className="mb-3 text-lg font-semibold">新規投稿</h2>}
      <form action={createPostAction} className="space-y-3">
        <input type="hidden" name="intent" value="create_post" />
        <div>
          <PostCodeTextarea
            name="code"
            value={code}
            onValueChange={setCode}
            language={language}
            placeholder="// 7行以内（各行200文字以内）のコード"
            required
            rows={7}
          />
          <div className="mt-1.5 flex items-center justify-between px-1 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Sparkles className="h-3.5 w-3.5" /> 7行以内・各行200文字以内。Mermaid は language に `Mermaid` を指定
            </span>
            <span className={overLimit ? "font-semibold text-rose-400" : "text-slate-400"}>{lineCount} / 7 lines</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="language"
            placeholder="language (optional)"
            list="language-suggestions"
            value={language}
            onChange={(e) => setLanguage(e.currentTarget.value)}
          />
          <input name="version" placeholder="version (optional)" list="version-suggestions" />
          <input name="tags" placeholder="tags (comma separated)" list="tag-suggestions" />
        </div>
        <datalist id="language-suggestions">
          {items.languages.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="version-suggestions">
          {items.versions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="tag-suggestions">
          {items.tags.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="grid gap-2">
          <textarea
            name="premiseText"
            placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
            rows={3}
            className="w-full resize-y"
          />
          <p className="text-xs text-slate-400">前提文は任意入力です（最大2行、各140文字以内）。</p>
        </div>

        <button
          type="submit"
          disabled={overLimit}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          投稿する
        </button>
      </form>
    </section>
  );
}
