import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { comments, follows, likes, postTags, posts, tags, users } from "@septcode/db/schema";
import { COMPOSER_MASTER } from "@septcode/db/composer-master";
import { db } from "@/lib/db";
import { parseDbTimestamp } from "@/lib/datetime";
import { parseProfileLanguages } from "@/lib/profile-languages";

export type TimelineItem = {
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
  authorAvatarUrl: string | null;
  authorProfileLanguages: string[];
  likeCount: number;
  commentCount: number;
  tags: string[];
  likedByMe: boolean;
};

type BaseTimelineRow = Omit<TimelineItem, "tags" | "likedByMe" | "authorProfileLanguages"> & {
  authorProfileLanguagesRaw: string | null;
};

type ParsedTimelineSearchQuery = {
  raw: string;
  textTerms: string[];
  tagTerms: string[];
  langTerms: string[];
  dateTerms: string[];
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function fuzzyIncludes(haystackRaw: string, needleRaw: string) {
  const haystack = normalizeSearchText(haystackRaw);
  const needle = normalizeSearchText(needleRaw);
  if (!needle) return true;
  return haystack.includes(needle);
}

function createSearchableDateText(createdAtRaw: string) {
  const created = parseDbTimestamp(createdAtRaw);
  if (!Number.isFinite(created.getTime())) {
    return normalizeSearchText(createdAtRaw);
  }

  const iso = created.toISOString();
  const yyyyMmDd = iso.slice(0, 10);
  const yyyyMm = yyyyMmDd.slice(0, 7);
  const yyyy = yyyyMmDd.slice(0, 4);

  return normalizeSearchText([createdAtRaw, yyyyMmDd, yyyyMmDd.replaceAll("-", "/"), yyyyMm, yyyy].join(" "));
}

function parseTimelineSearchQuery(query?: string | null): ParsedTimelineSearchQuery | null {
  const raw = String(query ?? "").trim();
  if (!raw) return null;

  const parsed: ParsedTimelineSearchQuery = {
    raw,
    textTerms: [],
    tagTerms: [],
    langTerms: [],
    dateTerms: []
  };

  for (const tokenRaw of raw.split(/\s+/)) {
    const token = tokenRaw.trim();
    if (!token) continue;

    const lower = token.toLowerCase();
    if (lower.startsWith("tag:")) {
      const term = normalizeSearchText(token.slice(4));
      if (term) parsed.tagTerms.push(term);
      continue;
    }
    if (lower.startsWith("lang:")) {
      const term = normalizeSearchText(token.slice(5));
      if (term) parsed.langTerms.push(term);
      continue;
    }
    if (lower.startsWith("language:")) {
      const term = normalizeSearchText(token.slice(9));
      if (term) parsed.langTerms.push(term);
      continue;
    }
    if (lower.startsWith("date:")) {
      const term = normalizeSearchText(token.slice(5));
      if (term) parsed.dateTerms.push(term);
      continue;
    }

    parsed.textTerms.push(normalizeSearchText(token));
  }

  return parsed;
}

function filterTimelineByQuery(items: TimelineItem[], query?: string | null) {
  const parsed = parseTimelineSearchQuery(query);
  if (!parsed) return items;

  return items.filter((item) => {
    const tagValues = item.tags.map((tag) => normalizeSearchText(tag));
    const languageValue = normalizeSearchText(item.language);
    const dateValue = createSearchableDateText(item.createdAt);
    const searchableText = [
      item.authorName,
      item.authorHandle,
      item.language,
      item.code,
      item.tags.join(" ")
    ].join("\n");

    const matchesTags = parsed.tagTerms.every((term) => tagValues.some((tag) => fuzzyIncludes(tag, term)));
    if (!matchesTags) return false;

    const matchesLang = parsed.langTerms.every((term) => fuzzyIncludes(languageValue, term));
    if (!matchesLang) return false;

    const matchesDate = parsed.dateTerms.every((term) => fuzzyIncludes(dateValue, term));
    if (!matchesDate) return false;

    const matchesText = parsed.textTerms.every((term) => fuzzyIncludes(searchableText, term));
    return matchesText;
  });
}

function buildTagMap(rows: Array<{ postId: number; name: string }>) {
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const current = map.get(row.postId) ?? [];
    current.push(row.name);
    map.set(row.postId, current);
  }
  return map;
}

async function hydrateTimeline(base: BaseTimelineRow[], userId?: number | null): Promise<TimelineItem[]> {
  const postIds = base.map((row) => row.id);
  const safePostIds = postIds.length ? postIds : [-1];

  const [tagRows, likedPostIds] = await Promise.all([
    postIds.length
      ? db
          .select({ postId: postTags.postId, name: tags.name })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(inArray(postTags.postId, postIds))
      : Promise.resolve([]),
    userId
      ? db
          .select({ postId: likes.postId })
          .from(likes)
          .where(and(eq(likes.userId, userId), inArray(likes.postId, safePostIds)))
      : Promise.resolve([])
  ]);

  const tagMap = buildTagMap(tagRows);
  const likedSet = new Set(likedPostIds.map((x) => x.postId));

  return base.map((row) => ({
    ...row,
    authorProfileLanguages: parseProfileLanguages(row.authorProfileLanguagesRaw),
    tags: tagMap.get(row.id) ?? [],
    likedByMe: likedSet.has(row.id)
  }));
}

async function getBaseRecentPosts(limit = 240): Promise<BaseTimelineRow[]> {
  return db
    .select({
      id: posts.id,
      publicId: posts.publicId,
      premise1: posts.premise1,
      premise2: posts.premise2,
      code: posts.code,
      language: posts.language,
      version: posts.version,
      aiSummary: posts.aiSummary,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorHandle: users.handle,
      authorAvatarUrl: users.avatarUrl,
      authorProfileLanguagesRaw: users.profileLanguages,
      likeCount: sql<number>`cast(count(distinct ${likes.userId}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.id)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function getRecommendedTimelinePage(userId: number | null, page: number, limit: number, query?: string | null) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const base = await getBaseRecentPosts(240);
  const enriched = await hydrateTimeline(base, userId);

  let ranked: TimelineItem[] = [];

  if (userId) {
    const [likedLangRows, likedTagRows, followedRows] = await Promise.all([
      db
        .select({ language: posts.language })
        .from(likes)
        .innerJoin(posts, eq(likes.postId, posts.id))
        .where(eq(likes.userId, userId))
        .limit(200),
      db
        .select({ name: tags.name })
        .from(likes)
        .innerJoin(postTags, eq(likes.postId, postTags.postId))
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(likes.userId, userId))
        .limit(400),
      db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, userId))
    ]);

    const langScore = new Map<string, number>();
    for (const row of likedLangRows) {
      const key = row.language.toLowerCase();
      langScore.set(key, (langScore.get(key) ?? 0) + 1);
    }

    const tagScore = new Map<string, number>();
    for (const row of likedTagRows) {
      const key = row.name.toLowerCase();
      tagScore.set(key, (tagScore.get(key) ?? 0) + 1);
    }

    const followedSet = new Set(followedRows.map((x) => x.followingId));

    ranked = [...enriched].sort((a, b) => {
      const scoreA = calculateRecommendationScore(a, langScore, tagScore, followedSet);
      const scoreB = calculateRecommendationScore(b, langScore, tagScore, followedSet);
      return scoreB - scoreA;
    });
  } else {
    ranked = [...enriched].sort((a, b) => {
      const scoreA = calculateGuestScore(a);
      const scoreB = calculateGuestScore(b);
      return scoreB - scoreA;
    });
  }

  const filtered = filterTimelineByQuery(ranked, query);
  const start = (safePage - 1) * safeLimit;
  const items = filtered.slice(start, start + safeLimit);
  return {
    items,
    hasMore: start + safeLimit < filtered.length
  };
}

function calculateRecommendationScore(
  post: TimelineItem,
  langScore: Map<string, number>,
  tagScore: Map<string, number>,
  followedSet: Set<number>
) {
  const now = Date.now();
  const created = parseDbTimestamp(post.createdAt).getTime();
  const ageHours = Number.isFinite(created) ? Math.max(0, (now - created) / 36e5) : 999;
  const recency = Math.max(0, 72 - ageHours) / 72;

  const engagement = post.likeCount * 0.7 + post.commentCount * 1.1;
  const langPref = (langScore.get(post.language.toLowerCase()) ?? 0) * 1.5;
  const tagPref = Math.min(
    8,
    post.tags.reduce((sum, t) => sum + (tagScore.get(t.toLowerCase()) ?? 0), 0)
  );
  const followBonus = followedSet.has(post.authorId) ? 4 : 0;
  const jitter = (post.id % 7) * 0.001;

  return engagement + recency * 5 + langPref + tagPref + followBonus + jitter;
}

function calculateGuestScore(post: TimelineItem) {
  const now = Date.now();
  const created = parseDbTimestamp(post.createdAt).getTime();
  const ageHours = Number.isFinite(created) ? Math.max(0, (now - created) / 36e5) : 999;
  const recency = Math.max(0, 72 - ageHours) / 72;
  const engagement = post.likeCount * 0.8 + post.commentCount * 1.2;
  return engagement + recency * 5 + (post.id % 5) * 0.001;
}

export async function getFollowingTimelinePage(userId: number, page: number, limit: number, query?: string | null) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (safePage - 1) * safeLimit;

  const parsedQuery = parseTimelineSearchQuery(query);
  if (parsedQuery) {
    const base: BaseTimelineRow[] = await db
      .select({
        id: posts.id,
        publicId: posts.publicId,
        premise1: posts.premise1,
        premise2: posts.premise2,
        code: posts.code,
        language: posts.language,
        version: posts.version,
        aiSummary: posts.aiSummary,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorHandle: users.handle,
        authorAvatarUrl: users.avatarUrl,
        authorProfileLanguagesRaw: users.profileLanguages,
        likeCount: sql<number>`cast(count(distinct ${likes.userId}) as int)`,
        commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .innerJoin(follows, eq(follows.followingId, posts.userId))
      .leftJoin(likes, eq(likes.postId, posts.id))
      .leftJoin(comments, eq(comments.postId, posts.id))
      .where(eq(follows.followerId, userId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(400);

    const enriched = await hydrateTimeline(base, userId);
    const filtered = filterTimelineByQuery(enriched, parsedQuery.raw);
    const items = filtered.slice(offset, offset + safeLimit);
    return {
      items,
      hasMore: offset + safeLimit < filtered.length
    };
  }

  const base: BaseTimelineRow[] = await db
    .select({
      id: posts.id,
      publicId: posts.publicId,
      premise1: posts.premise1,
      premise2: posts.premise2,
      code: posts.code,
      language: posts.language,
      version: posts.version,
      aiSummary: posts.aiSummary,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorHandle: users.handle,
      authorAvatarUrl: users.avatarUrl,
      authorProfileLanguagesRaw: users.profileLanguages,
      likeCount: sql<number>`cast(count(distinct ${likes.userId}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .innerJoin(follows, eq(follows.followingId, posts.userId))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(eq(follows.followerId, userId))
    .groupBy(posts.id, users.id)
    .orderBy(desc(posts.createdAt))
    .limit(safeLimit + 1)
    .offset(offset);

  const hasMore = base.length > safeLimit;
  const items = await hydrateTimeline(base.slice(0, safeLimit), userId);
  return { items, hasMore };
}

export async function getLatestTimelinePage(userId: number | null, page: number, limit: number, query?: string | null) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (safePage - 1) * safeLimit;

  const parsedQuery = parseTimelineSearchQuery(query);
  if (parsedQuery) {
    const base = await getBaseRecentPosts(400);
    const enriched = await hydrateTimeline(base, userId);
    const filtered = filterTimelineByQuery(enriched, parsedQuery.raw);
    const items = filtered.slice(offset, offset + safeLimit);
    return {
      items,
      hasMore: offset + safeLimit < filtered.length
    };
  }

  const base: BaseTimelineRow[] = await db
    .select({
      id: posts.id,
      publicId: posts.publicId,
      premise1: posts.premise1,
      premise2: posts.premise2,
      code: posts.code,
      language: posts.language,
      version: posts.version,
      aiSummary: posts.aiSummary,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorHandle: users.handle,
      authorAvatarUrl: users.avatarUrl,
      authorProfileLanguagesRaw: users.profileLanguages,
      likeCount: sql<number>`cast(count(distinct ${likes.userId}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.id)
    .orderBy(desc(posts.createdAt))
    .limit(safeLimit + 1)
    .offset(offset);

  const hasMore = base.length > safeLimit;
  const items = await hydrateTimeline(base.slice(0, safeLimit), userId);
  return { items, hasMore };
}

export async function getTimelinePage({
  tab,
  userId,
  page,
  limit,
  query
}: {
  tab: "for-you" | "latest" | "following";
  userId: number | null;
  page: number;
  limit: number;
  query?: string | null;
}) {
  if (tab === "following") {
    if (!userId) return { items: [], hasMore: false };
    return getFollowingTimelinePage(userId, page, limit, query);
  }
  if (tab === "latest") {
    return getLatestTimelinePage(userId, page, limit, query);
  }
  return getRecommendedTimelinePage(userId, page, limit, query);
}

export async function getTimeline(userId?: number | null) {
  const result = await getRecommendedTimelinePage(userId ?? null, 1, 50);
  return result.items;
}

export async function getFollowingTimeline(userId: number) {
  const result = await getFollowingTimelinePage(userId, 1, 50);
  return result.items;
}

export async function getComposerSuggestions() {
  const [languageRows, versionRows, tagRows] = await Promise.all([
    db
      .select({ value: posts.language })
      .from(posts)
      .groupBy(posts.language)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(30),
    db
      .select({ value: posts.version })
      .from(posts)
      .where(sql`${posts.version} is not null and ${posts.version} <> ''`)
      .groupBy(posts.version)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(30),
    db.select({ value: tags.name }).from(tags).orderBy(tags.name).limit(80)
  ]);

  return {
    languages: mergeComposerSuggestions(languageRows.map((x) => x.value), COMPOSER_MASTER.languages),
    versions: mergeComposerSuggestions(versionRows.map((x) => x.value), COMPOSER_MASTER.versions),
    tags: mergeComposerSuggestions(tagRows.map((x) => x.value), COMPOSER_MASTER.tags)
  };
}

function mergeComposerSuggestions(values: Array<string | null>, fallback: readonly string[]) {
  const unique = new Map<string, string>();
  for (const raw of [...values, ...fallback]) {
    if (!raw) continue;
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!unique.has(key)) unique.set(key, value);
  }
  return Array.from(unique.values()).slice(0, 80);
}

export async function getPostDetail(publicId: string, userId?: number | null) {
  const post = (
    await db
      .select({
        id: posts.id,
        publicId: posts.publicId,
        premise1: posts.premise1,
        premise2: posts.premise2,
        code: posts.code,
        language: posts.language,
        version: posts.version,
        aiSummary: posts.aiSummary,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorName: users.name,
      authorHandle: users.handle,
      authorAvatarUrl: users.avatarUrl,
      authorProfileLanguagesRaw: users.profileLanguages
    })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.publicId, publicId))
      .limit(1)
  )[0];

  if (!post) return null;

  const [tagRows, likeRows, commentRows] = await Promise.all([
    db
      .select({ name: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
    db
      .select({ userId: likes.userId })
      .from(likes)
      .where(eq(likes.postId, post.id)),
    db
      .select({
        id: comments.id,
        userId: comments.userId,
        body: comments.body,
        createdAt: comments.createdAt,
        userName: users.name,
        userHandle: users.handle
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, post.id))
      .orderBy(desc(comments.createdAt))
  ]);

  return {
    ...post,
    tags: tagRows.map((t) => t.name),
    likeCount: likeRows.length,
    likedByMe: userId ? likeRows.some((x) => x.userId === userId) : false,
    comments: commentRows
  };
}

export async function getProfileById(id: number, viewerId?: number | null) {
  const user = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
  if (!user) return null;

  const [followerCount, followingCount, isFollowing, userPostsBase] = await Promise.all([
    db.select({ value: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, user.id)),
    viewerId
      ? db
          .select({ followerId: follows.followerId })
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)))
      : Promise.resolve([]),
    db
      .select({
        id: posts.id,
        publicId: posts.publicId,
        premise1: posts.premise1,
        premise2: posts.premise2,
        code: posts.code,
        language: posts.language,
        version: posts.version,
        aiSummary: posts.aiSummary,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(eq(posts.userId, user.id))
      .orderBy(desc(posts.createdAt))
  ]);
  const userPosts = await hydrateTimeline(
    userPostsBase.map((row) => ({
      ...row,
      authorId: user.id,
      authorName: user.name,
      authorHandle: user.handle,
      authorAvatarUrl: user.avatarUrl ?? null,
      authorProfileLanguagesRaw: user.profileLanguages ?? "",
      likeCount: 0,
      commentCount: 0
    })),
    viewerId
  );

  const postIds = userPosts.map((post) => post.id);
  const safePostIds = postIds.length ? postIds : [-1];
  const [likeCounts, commentCounts] = await Promise.all([
    db
      .select({
        postId: likes.postId,
        count: sql<number>`cast(count(*) as int)`
      })
      .from(likes)
      .where(inArray(likes.postId, safePostIds))
      .groupBy(likes.postId),
    db
      .select({
        postId: comments.postId,
        count: sql<number>`cast(count(*) as int)`
      })
      .from(comments)
      .where(inArray(comments.postId, safePostIds))
      .groupBy(comments.postId)
  ]);

  const likeCountMap = new Map(likeCounts.map((x) => [x.postId, x.count]));
  const commentCountMap = new Map(commentCounts.map((x) => [x.postId, x.count]));

  return {
    ...user,
    profileLanguages: parseProfileLanguages(user.profileLanguages ?? ""),
    followerCount: followerCount[0]?.value ?? 0,
    followingCount: followingCount[0]?.value ?? 0,
    isFollowing: isFollowing.length > 0,
    posts: userPosts.map((post) => ({
      ...post,
      likeCount: likeCountMap.get(post.id) ?? 0,
      commentCount: commentCountMap.get(post.id) ?? 0
    }))
  };
}

export async function getPostSitemapEntries(limit = 50000) {
  return db
    .select({
      publicId: posts.publicId,
      createdAt: posts.createdAt
    })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}
