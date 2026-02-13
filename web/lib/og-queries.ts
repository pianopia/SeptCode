import { db } from "@/lib/db";
import { posts, users, postTags, tags } from "@septcode/db/schema";
import { eq } from "drizzle-orm";

export async function getPostForOg(publicId: string) {
    const row = (
        await db
            .select({
                code: posts.code,
                language: posts.language,
                premise1: posts.premise1,
                premise2: posts.premise2,
                authorHandle: users.handle
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(eq(posts.publicId, publicId))
            .limit(1)
    )[0];

    if (!row) return null;

    const tagRows = await db
        .select({ name: tags.name })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .innerJoin(posts, eq(postTags.postId, posts.id))
        .where(eq(posts.publicId, publicId));

    return {
        ...row,
        tags: tagRows.map((t) => t.name)
    };
}
