"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { createPostAction } from "@/app/actions";

type ComposerSuggestions = {
  languages: string[];
  versions: string[];
  tags: string[];
};

const DEFAULT_SUGGESTIONS: ComposerSuggestions = {
  languages: ["TypeScript", "JavaScript", "Python", "Rust", "SQL", "Mermaid"],
  versions: ["latest", "v5", "v4", "3.12", "1.81"],
  tags: ["react", "nextjs", "drizzle", "turso", "mermaid", "highlightjs"]
};

export function PostComposer({
  compact = false,
  suggestions
}: {
  compact?: boolean;
  suggestions?: ComposerSuggestions;
}) {
  const [code, setCode] = useState("");
  const lineCount = useMemo(() => (code.length ? code.split("\n").length : 1), [code]);
  const overLimit = lineCount > 7;
  const items = suggestions ?? DEFAULT_SUGGESTIONS;

  return (
    <section className={compact ? "" : "rounded-xl border border-slate-700 bg-panel/80 p-4"}>
      {!compact && <h2 className="mb-3 text-lg font-semibold">新規投稿</h2>}
      <form action={createPostAction} className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0d1117]">
          <div className="grid grid-cols-[44px_1fr]">
            <div className="select-none border-r border-slate-800 bg-slate-900/70 py-3 text-center font-mono text-xs leading-6 text-slate-600">
              {Array.from({ length: Math.max(7, lineCount) }).map((_, i) => (
                <div key={i} className={i >= 7 ? "bg-rose-500/10 font-bold text-rose-400" : ""}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// 7行以内のコード"
              required
              rows={7}
              className={`min-h-44 w-full resize-y border-0 bg-transparent px-3 py-3 font-mono text-sm leading-6 focus:outline-none ${
                overLimit ? "text-rose-300" : "text-slate-200"
              }`}
            />
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Sparkles className="h-3.5 w-3.5" /> Mermaid は language に `Mermaid` を指定
            </span>
            <span className={overLimit ? "font-semibold text-rose-400" : "text-slate-400"}>{lineCount} / 7 lines</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input name="language" placeholder="language (e.g. TypeScript)" required list="language-suggestions" />
          <input name="version" placeholder="version (e.g. v5)" defaultValue="latest" required list="version-suggestions" />
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

        <div>
          <textarea
            name="premiseText"
            placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
            required
            maxLength={300}
            rows={2}
            className="w-full resize-none"
          />
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
