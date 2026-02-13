"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { comments, follows, likes, postTags, posts, tags, users } from "@septcode/db/schema";
import { explainCode } from "@/lib/ai";
import { clearSession, comparePassword, getSessionUserId, hashPassword, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildInvalidPostRedirect, resolveCreatePostErrorMessage } from "@/lib/post-errors";
import { buildPremiseTextFromFormValues } from "@/lib/premise";
import { serializeProfileLanguages } from "@/lib/profile-languages";
import { uploadAvatarImage } from "@/lib/storage";
import { commentSchema, createPostSchema, deleteCommentSchema, loginSchema, registerSchema, updateProfileSchema } from "@/lib/validators";

function hasIntent(formData: FormData, expected: string) {
  return formData.get("intent") === expected;
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((x) => x.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

async function replacePostTags(postId: number, tagNames: string[], language: string) {
  await db.delete(postTags).where(eq(postTags.postId, postId));

  for (const name of tagNames) {
    const found = (await db.select().from(tags).where(eq(tags.name, name)).limit(1))[0];
    if (!found) {
      await db
        .insert(tags)
        .values({
          name,
          kind:
            name.toLowerCase() === language.toLowerCase() ? "language" : /^v?\d/.test(name) ? "version" : "library"
        })
        .onConflictDoNothing();
    }
    const current = (await db.select().from(tags).where(eq(tags.name, name)).limit(1))[0];
    if (!current) continue;
    await db.insert(postTags).values({ postId, tagId: current.id }).onConflictDoNothing();
  }
}

export async function registerAction(formData: FormData) {
  if (!hasIntent(formData, "register")) redirect("/register");

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
  if (!hasIntent(formData, "login")) redirect("/login");

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

export async function logoutAction(formData: FormData) {
  if (!hasIntent(formData, "logout")) redirect("/");

  clearSession();
  redirect("/");
}

export async function createPostAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "create_post")) redirect("/");

  const premiseText = buildPremiseTextFromFormValues(formData.get("premise1"), formData.get("premise2"), formData.get("premiseText"));

  const parsed = createPostSchema.safeParse({
    premiseText,
    code: String(formData.get("code") ?? ""),
    language: String(formData.get("language") ?? ""),
    version: String(formData.get("version") ?? ""),
    tags: String(formData.get("tags") ?? "")
  });

  if (!parsed.success) {
    redirect(buildInvalidPostRedirect(resolveCreatePostErrorMessage(parsed.error)));
  }

  const premiseLines = parsed.data.premiseText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const premise1 = premiseLines[0] ?? "";
  const premise2 = premiseLines[1] ?? "";
  const aiSummary = await explainCode(premise1 || "前提なし", premise2 || "前提なし", parsed.data.code);
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
      version: parsed.data.version || null,
      aiSummary
    })
    .returning({ id: posts.id });

  const postId = created[0].id;
  const tagNames = parseTags(parsed.data.tags);
  await replacePostTags(postId, tagNames, parsed.data.language);

  revalidatePath("/");
  redirect(`/posts/${publicId}`);
}

export async function updatePostAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "update_post")) redirect("/");

  const postPublicId = String(formData.get("postPublicId") ?? "");
  if (!postPublicId) redirect("/");

  const existing = (
    await db
      .select({ id: posts.id, userId: posts.userId, publicId: posts.publicId })
      .from(posts)
      .where(eq(posts.publicId, postPublicId))
      .limit(1)
  )[0];
  if (!existing || existing.userId !== userId) redirect(`/posts/${postPublicId}`);

  const premiseText = buildPremiseTextFromFormValues(formData.get("premise1"), formData.get("premise2"), formData.get("premiseText"));
  const parsed = createPostSchema.safeParse({
    premiseText,
    code: String(formData.get("code") ?? ""),
    language: String(formData.get("language") ?? ""),
    version: String(formData.get("version") ?? ""),
    tags: String(formData.get("tags") ?? "")
  });

  if (!parsed.success) {
    redirect(buildInvalidPostRedirect(resolveCreatePostErrorMessage(parsed.error), `/posts/${postPublicId}/edit`));
  }

  const premiseLines = parsed.data.premiseText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const premise1 = premiseLines[0] ?? "";
  const premise2 = premiseLines[1] ?? "";
  const aiSummary = await explainCode(premise1 || "前提なし", premise2 || "前提なし", parsed.data.code);

  await db
    .update(posts)
    .set({
      premise1,
      premise2,
      code: parsed.data.code,
      language: parsed.data.language,
      version: parsed.data.version || null,
      aiSummary
    })
    .where(eq(posts.id, existing.id));

  const tagNames = parseTags(parsed.data.tags);
  await replacePostTags(existing.id, tagNames, parsed.data.language);

  revalidatePath("/");
  revalidatePath(`/posts/${postPublicId}`);
  revalidatePath(`/u/${userId}`);
  redirect(`/posts/${postPublicId}`);
}

export async function deletePostAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "delete_post")) redirect("/");

  const postPublicId = String(formData.get("postPublicId") ?? "");
  if (!postPublicId) redirect("/");

  const existing = (
    await db
      .select({ id: posts.id, userId: posts.userId })
      .from(posts)
      .where(eq(posts.publicId, postPublicId))
      .limit(1)
  )[0];
  if (!existing || existing.userId !== userId) redirect(`/posts/${postPublicId}`);

  const rawReturnTo = String(formData.get("returnTo") ?? "");
  const returnTo =
    rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") && !rawReturnTo.startsWith("/\\")
      ? rawReturnTo
      : "/";

  await db.delete(posts).where(eq(posts.id, existing.id));
  revalidatePath("/");
  if (returnTo.startsWith("/search")) revalidatePath("/search");
  revalidatePath(`/u/${userId}`);
  redirect(returnTo);
}

export async function toggleLikeAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "toggle_like")) redirect("/");

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
  if (!hasIntent(formData, "add_comment")) redirect("/");

  const postId = Number(formData.get("postId"));
  const postPublicId = String(formData.get("postPublicId") ?? "");
  const body = String(formData.get("body") ?? "");
  const parsed = commentSchema.safeParse({ postId, postPublicId, body });
  if (!parsed.success) redirect(`/posts/${postPublicId}?error=invalid_comment`);

  await db.insert(comments).values({ postId: parsed.data.postId, userId, body: parsed.data.body });
  revalidatePath(`/posts/${parsed.data.postPublicId}`);
}

export async function deleteCommentAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "delete_comment")) redirect("/");

  const commentId = Number(formData.get("commentId"));
  const postPublicId = String(formData.get("postPublicId") ?? "");
  const parsed = deleteCommentSchema.safeParse({ commentId, postPublicId });
  if (!parsed.success) redirect(postPublicId ? `/posts/${postPublicId}` : "/");

  const existing = (
    await db
      .select({ id: comments.id, userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, parsed.data.commentId))
      .limit(1)
  )[0];

  if (!existing || existing.userId !== userId) redirect(`/posts/${parsed.data.postPublicId}`);

  await db.delete(comments).where(eq(comments.id, existing.id));
  revalidatePath(`/posts/${parsed.data.postPublicId}`);
}

export async function toggleFollowAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "toggle_follow")) redirect("/");

  const targetUserId = Number(formData.get("targetUserId"));
  if (!Number.isFinite(targetUserId) || targetUserId === userId) redirect("/");

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

  revalidatePath(`/u/${targetUserId}`);
}

export async function updateProfileAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  if (!hasIntent(formData, "update_profile")) redirect("/");

  const parsed = updateProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    profileLanguages: String(formData.get("profileLanguages") ?? "")
  });
  if (!parsed.success) redirect(`/u/${userId}?error=invalid_profile`);

  const rawAvatar = formData.get("avatar");
  const avatar = rawAvatar instanceof File ? rawAvatar : null;

  let avatarUrl: string | undefined;
  if (avatar && avatar.size > 0) {
    try {
      avatarUrl = await uploadAvatarImage(userId, avatar);
    } catch {
      redirect(`/u/${userId}?error=invalid_avatar`);
    }
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name.trim(),
      bio: parsed.data.bio.trim(),
      profileLanguages: serializeProfileLanguages(parsed.data.profileLanguages),
      ...(avatarUrl ? { avatarUrl } : {})
    })
    .where(eq(users.id, userId));

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/u/${userId}`);
  redirect(`/u/${userId}`);
}
