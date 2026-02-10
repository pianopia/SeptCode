"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { comments, follows, likes, postTags, posts, tags, users } from "@septima/db/schema";
import { explainCode } from "@/lib/ai";
import { clearSession, comparePassword, getSessionUserId, hashPassword, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { commentSchema, createPostSchema, loginSchema, registerSchema } from "@/lib/validators";

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((x) => x.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    handle: formData.get("handle"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) redirect("/register?error=invalid_input");

  const { name, handle, email, password } = parsed.data;
  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (exists.length > 0) redirect("/register?error=email_taken");

  const duplicateHandle = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  if (duplicateHandle.length > 0) redirect("/register?error=handle_taken");

  const passwordHash = await hashPassword(password);
  const created = await db.insert(users).values({ name, handle, email, passwordHash }).returning({ id: users.id });
  await setSession(created[0].id);
  redirect("/");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=invalid_input");

  const user = (
    await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1)
  )[0];

  if (!user) redirect("/login?error=wrong_credentials");

  const ok = await comparePassword(parsed.data.password, user.passwordHash);
  if (!ok) redirect("/login?error=wrong_credentials");

  await setSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  clearSession();
  redirect("/");
}

export async function createPostAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const parsed = createPostSchema.safeParse({
    premiseText: formData.get("premiseText"),
    code: formData.get("code"),
    language: formData.get("language"),
    version: formData.get("version"),
    tags: formData.get("tags")
  });

  if (!parsed.success) redirect("/?error=invalid_post");

  const [premise1, premise2] = parsed.data.premiseText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!premise1 || !premise2) redirect("/?error=invalid_post");

  const aiSummary = await explainCode(premise1, premise2, parsed.data.code);
  const publicId = crypto.randomUUID();
  const created = await db
    .insert(posts)
    .values({
      publicId,
      userId,
      premise1,
      premise2,
      code: parsed.data.code,
      language: parsed.data.language,
      version: parsed.data.version,
      aiSummary
    })
    .returning({ id: posts.id });

  const postId = created[0].id;
  const tagNames = parseTags(parsed.data.tags);

  for (const name of tagNames) {
    const found = (await db.select().from(tags).where(eq(tags.name, name)).limit(1))[0];
    if (!found) {
      await db
        .insert(tags)
        .values({
          name,
          kind:
            name.toLowerCase() === parsed.data.language.toLowerCase()
              ? "language"
              : /^v?\d/.test(name)
                ? "version"
                : "library"
        })
        .onConflictDoNothing();
    }
    const current = (await db.select().from(tags).where(eq(tags.name, name)).limit(1))[0];
    if (!current) continue;
    const tagId = current.id;
    await db.insert(postTags).values({ postId, tagId }).onConflictDoNothing();
  }

  revalidatePath("/");
  redirect(`/posts/${publicId}`);
}

export async function toggleLikeAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const postId = Number(formData.get("postId"));
  const postPublicId = String(formData.get("postPublicId") ?? "");
  if (!Number.isFinite(postId)) redirect("/");

  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
  } else {
    await db.insert(likes).values({ postId, userId });
  }

  revalidatePath("/");
  if (postPublicId) revalidatePath(`/posts/${postPublicId}`);
}

export async function addCommentAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const postId = Number(formData.get("postId"));
  const postPublicId = String(formData.get("postPublicId") ?? "");
  const body = String(formData.get("body") ?? "");
  const parsed = commentSchema.safeParse({ postId, postPublicId, body });
  if (!parsed.success) redirect(`/posts/${postPublicId}?error=invalid_comment`);

  await db.insert(comments).values({ postId: parsed.data.postId, userId, body: parsed.data.body });
  revalidatePath(`/posts/${parsed.data.postPublicId}`);
}

export async function toggleFollowAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const targetUserId = Number(formData.get("targetUserId"));
  const targetHandle = String(formData.get("targetHandle") ?? "");
  if (!Number.isFinite(targetUserId) || targetUserId === userId) redirect(`/u/${targetHandle}`);

  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)));
  } else {
    await db.insert(follows).values({ followerId: userId, followingId: targetUserId });
  }

  revalidatePath(`/u/${targetHandle}`);
}
