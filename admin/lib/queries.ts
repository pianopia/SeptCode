import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { comments, likes, postTags, posts, tags, users } from "@septcode/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function getDashboardSummary() {
  const [userCount, postCount, tagCount, commentCount, recentUsers, recentPosts] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db.select({ value: sql<number>`count(*)` }).from(posts),
    db.select({ value: sql<number>`count(*)` }).from(tags),
    db.select({ value: sql<number>`count(*)` }).from(comments),
    db
      .select({ id: users.id, name: users.name, handle: users.handle, createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5),
    db
      .select({ id: posts.id, publicId: posts.publicId, language: posts.language, createdAt: posts.createdAt })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(5)
  ]);

  return {
    counts: {
      users: Number(userCount[0]?.value ?? 0),
      posts: Number(postCount[0]?.value ?? 0),
      tags: Number(tagCount[0]?.value ?? 0),
      comments: Number(commentCount[0]?.value ?? 0)
    },
    recentUsers,
    recentPosts
  };
}

export async function getMasterData() {
  const all = await db.select().from(tags).orderBy(tags.kind, tags.name);
  return {
    languages: all.filter((x) => x.kind === "language"),
    versions: all.filter((x) => x.kind === "version"),
    libraries: all.filter((x) => x.kind === "library"),
    topics: all.filter((x) => x.kind === "topic")
  };
}

export async function getUsersForAdmin() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      handle: users.handle,
      email: users.email,
      createdAt: users.createdAt,
      postCount: sql<number>`cast((select count(*) from posts p where p.user_id = ${users.id}) as int)`,
      followerCount: sql<number>`cast((select count(*) from follows f where f.following_id = ${users.id}) as int)`,
      followingCount: sql<number>`cast((select count(*) from follows f2 where f2.follower_id = ${users.id}) as int)`
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return rows;
}

export async function getOfficialPostsForAdmin(limit = 20) {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const isOfficialTagPost = sql<boolean>`exists (
    select 1
    from ${postTags}
    inner join ${tags} on ${postTags.tagId} = ${tags.id}
    where ${postTags.postId} = ${posts.id}
      and lower(${tags.name}) = 'official'
  )`;

  const rows = await db
    .select({
      id: posts.id,
      publicId: posts.publicId,
      premise1: posts.premise1,
      premise2: posts.premise2,
      language: posts.language,
      version: posts.version,
      code: posts.code,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorHandle: users.handle,
      authorAvatarUrl: users.avatarUrl,
      likeCount: sql<number>`cast(count(distinct ${likes.userId}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(or(eq(users.handle, env.officialPostHandle), isOfficialTagPost))
    .groupBy(posts.id, users.id)
    .orderBy(desc(posts.createdAt))
    .limit(safeLimit);

  const postIds = rows.map((row) => row.id);
  const tagRows =
    postIds.length > 0
      ? await db
          .select({ postId: postTags.postId, name: tags.name })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(inArray(postTags.postId, postIds))
      : [];

  const tagMap = new Map<number, string[]>();
  for (const row of tagRows) {
    const values = tagMap.get(row.postId) ?? [];
    values.push(row.name);
    tagMap.set(row.postId, values);
  }

  return rows.map((row) => ({
    ...row,
    tags: tagMap.get(row.id) ?? [],
    lineCount: row.code.split("\n").filter((line) => line.trim().length > 0).length
  }));
}
