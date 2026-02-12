"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PostComposer } from "@/components/PostComposer";

type ComposerSuggestions = {
  languages: string[];
  versions: string[];
  tags: string[];
};

export function ComposeFab({ suggestions }: { suggestions: ComposerSuggestions }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-slate-950 shadow-xl shadow-emerald-900/40 hover:bg-green-400"
        aria-label="新規投稿"
      >
        <Plus className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold text-slate-200">新規投稿</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-600 p-1.5 text-slate-300 hover:text-white"
                aria-label="モーダルを閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <PostComposer compact suggestions={suggestions} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
