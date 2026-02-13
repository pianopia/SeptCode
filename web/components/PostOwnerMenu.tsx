"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { deletePostAction } from "@/app/actions";

export function PostOwnerMenu({ postPublicId }: { postPublicId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        aria-label="投稿メニュー"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-slate-700 bg-slate-900 p-1 text-sm shadow-xl shadow-black/40">
          <Link
            href={`/posts/${postPublicId}/edit`}
            className="block rounded-md px-3 py-2 text-slate-200 hover:bg-slate-800"
            onClick={() => setMenuOpen(false)}
          >
            編集する
          </Link>
          <form action={deletePostAction}>
            <input type="hidden" name="intent" value="delete_post" />
            <input type="hidden" name="postPublicId" value={postPublicId} />
            <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-rose-300 hover:bg-rose-500/10">
              削除する
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
