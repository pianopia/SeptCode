"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Hash, Heart, MessageCircle, MoreHorizontal, Share2, Sparkles, Terminal } from "lucide-react";
import { toggleLikeAction } from "@/app/actions";
import { CodeRenderer } from "@/components/CodeRenderer";

type TimelinePost = {
  id: number;
  publicId: string;
  premise1: string;
  premise2: string;
  code: string;
  language: string;
  version: string | null;
  aiSummary: string | null;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorHandle: string;
  likeCount: number;
  commentCount: number;
  tags: string[];
  likedByMe: boolean;
};

export function PostCard({ post, canLike }: { post: TimelinePost; canLike: boolean }) {
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);

  const langClass = useMemo(() => {
    const l = post.language.toLowerCase();
    if (l.includes("react") || l.includes("typescript") || l.includes("javascript")) {
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
    if (l.includes("python")) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    if (l.includes("rust")) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    if (l.includes("shell") || l.includes("bash")) return "text-green-400 bg-green-500/10 border-green-500/20";
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  }, [post.language]);

  const previewGradient = useMemo(() => {
    const l = post.language.toLowerCase();
    if (l.includes("react") || l.includes("typescript") || l.includes("javascript")) return "from-blue-500 to-cyan-400";
    if (l.includes("python")) return "from-yellow-500 to-orange-500";
    if (l.includes("rust")) return "from-orange-600 to-yellow-600";
    if (l.includes("shell") || l.includes("bash")) return "from-emerald-500 to-green-600";
    if (l.includes("sql")) return "from-indigo-600 to-blue-800";
    if (l.includes("mermaid")) return "from-fuchsia-600 to-purple-600";
    return "from-slate-700 to-slate-600";
  }, [post.language]);

  const timeText = useMemo(() => {
    const created = new Date(post.createdAt);
    if (Number.isNaN(created.getTime())) return "just now";
    const diffMin = Math.floor((Date.now() - created.getTime()) / 60000);
    if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`;
    if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / (60 * 24))}d ago`;
  }, [post.createdAt]);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.authorHandle)}`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(post.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between border-b border-slate-800/50 bg-[#0d1117] p-4">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.authorId}`} aria-label={`${post.authorName} のプロフィール`} className="block">
            <img src={avatarUrl} alt={post.authorName} className="h-10 w-10 rounded-full border border-slate-700 bg-slate-800" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/u/${post.authorId}`} className="text-sm font-bold text-slate-200 hover:text-slate-50">
                {post.authorName}
              </Link>
              <span className="text-xs text-slate-500">@{post.authorHandle}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono ${langClass}`}>{post.language}</span>
              <span className="text-[10px] text-slate-600">{timeText}</span>
            </div>
          </div>
        </div>
        <Link href={`/posts/${post.publicId}`} className="text-slate-500 hover:text-slate-300">
          <MoreHorizontal className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative bg-[#0d1117]">
        <div className="px-4 py-5">
          <CodeRenderer language={post.language} code={post.code} />
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="absolute right-2 top-2 rounded-md bg-slate-800/50 p-2 text-slate-400 opacity-0 backdrop-blur-sm transition hover:bg-slate-700 hover:text-white group-hover:opacity-100"
        >
          <Copy className="h-4 w-4" />
        </button>
        {copied && <span className="absolute bottom-2 right-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-200">Copied</span>}
      </div>

      <div className="relative">
        <div className={`flex h-12 w-full items-center justify-between overflow-hidden bg-gradient-to-r px-4 ${previewGradient}`}>
          <div className="flex items-center gap-2">
            <Terminal className="h-3 w-3 text-white/50" />
            <span className="text-[10px] uppercase tracking-wider text-white/60">Output Preview</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAiAnalysis((v) => !v)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold ${
              showAiAnalysis
                ? "border-purple-400 bg-purple-500 text-white"
                : "border-white/10 bg-black/20 text-white hover:bg-black/40"
            }`}
          >
            <Sparkles className="h-3 w-3" /> AI Analyze
          </button>
        </div>

        {showAiAnalysis && (
          <div className="border-t border-slate-700 bg-slate-800/90 p-4">
            <p className="mb-1 text-[10px] font-bold tracking-wider text-purple-300">SEPTIMA AI INSIGHT</p>
            <p className="text-sm font-medium leading-relaxed text-slate-200">{post.aiSummary || "解説未生成"}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-4">
        <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-400">
          {`${post.premise1}\n${post.premise2}`}
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
            {post.version ?? "latest"}
          </span>
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 text-slate-500">
          <div className="flex items-center gap-6">
            <form action={toggleLikeAction}>
              <input type="hidden" name="intent" value="toggle_like" />
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="postPublicId" value={post.publicId} />
              <button
                type="submit"
                disabled={!canLike}
                className={`group inline-flex items-center gap-1.5 transition ${
                  post.likedByMe ? "text-pink-400" : "hover:text-pink-500"
                } disabled:opacity-40`}
              >
                <Heart className="h-5 w-5 transition group-active:scale-90 group-hover:scale-110" />
                <span className="text-xs font-medium">{post.likeCount}</span>
              </button>
            </form>
            <Link href={`/posts/${post.publicId}`} className="inline-flex items-center gap-1.5 transition hover:text-blue-400">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-medium">{post.commentCount}</span>
            </Link>
            <Link href={`/posts/${post.publicId}`} className="inline-flex items-center gap-1.5 transition hover:text-slate-300">
              <Share2 className="h-5 w-5" />
            </Link>
          </div>
          <span className="text-slate-600">
            <Hash className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
