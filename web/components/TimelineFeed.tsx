"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostCard } from "@/components/PostCard";

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

export function TimelineFeed({
  initialItems,
  initialHasMore,
  tab,
  canLike,
  viewerUserId,
  emptyMessage
}: {
  initialItems: TimelinePost[];
  initialHasMore: boolean;
  tab: "for-you" | "following";
  canLike: boolean;
  viewerUserId: number | null;
  emptyMessage: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialHasMore);
    setLoading(false);
  }, [initialItems, initialHasMore, tab]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/timeline?tab=${tab}&page=${nextPage}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items: TimelinePost[]; hasMore: boolean };
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, tab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const isEmpty = useMemo(() => items.length === 0, [items]);

  return (
    <section className="space-y-3">
      {items.map((post) => (
        <PostCard key={`${post.publicId}-${post.id}`} post={post} canLike={canLike} viewerUserId={viewerUserId} />
      ))}

      {isEmpty && <article className="rounded-xl border border-slate-700 bg-panel/70 p-5 text-sm text-slate-300">{emptyMessage}</article>}

      {hasMore && <div ref={sentinelRef} className="h-6" />}
      {loading && <p className="py-2 text-center text-xs text-slate-400">読み込み中...</p>}
    </section>
  );
}
