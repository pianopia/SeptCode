"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { posts, tags, users } from "@septcode/db/schema";
import { clearAdminSession, isAdminAuthenticated, setAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createAutomatedOfficialPost } from "@/lib/official-post";
import {
  adminLoginSchema,
  createMasterSchema,
  deleteMasterSchema,
  deleteOfficialPostSchema,
  runOfficialPostSchema,
  updateMasterSchema
} from "@/lib/validators";

function normalizeName(name: string) {
  return name.trim().replace(/^#/, "");
}

async function requireAdminAuth() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/login");
}

export async function adminLoginAction(formData: FormData) {
  const parsed = adminLoginSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password")
  });

  if (!parsed.success) redirect("/login?error=invalid_input");

  const ok = parsed.data.loginId === env.adminLoginId && parsed.data.password === env.adminLoginPassword;
  if (!ok) redirect("/login?error=wrong_credentials");

  await setAdminSession(parsed.data.loginId);
  redirect("/");
}

export async function adminLogoutAction() {
  await requireAdminAuth();
  clearAdminSession();
  redirect("/login");
}

export async function createMasterAction(formData: FormData) {
  await requireAdminAuth();

  const parsed = createMasterSchema.safeParse({
    name: normalizeName(String(formData.get("name") ?? "")),
    kind: formData.get("kind")
  });

  if (!parsed.success) redirect("/masters?error=invalid_input");

  const exists = (
    await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, parsed.data.name))
      .limit(1)
  )[0];

  if (exists) redirect("/masters?error=name_exists");

  await db.insert(tags).values({
    name: parsed.data.name,
    kind: parsed.data.kind
  });

  revalidatePath("/masters");
  revalidatePath("/");
  redirect("/masters");
}

export async function updateMasterAction(formData: FormData) {
  await requireAdminAuth();

  const parsed = updateMasterSchema.safeParse({
    id: formData.get("id"),
    name: normalizeName(String(formData.get("name") ?? "")),
    kind: formData.get("kind")
  });

  if (!parsed.success) redirect("/masters?error=invalid_input");

  const duplicate = (
    await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.name, parsed.data.name), ne(tags.id, parsed.data.id)))
      .limit(1)
  )[0];

  if (duplicate) redirect("/masters?error=name_exists");

  await db.update(tags).set({ name: parsed.data.name, kind: parsed.data.kind }).where(eq(tags.id, parsed.data.id));

  revalidatePath("/masters");
  revalidatePath("/");
  redirect("/masters");
}

export async function deleteMasterAction(formData: FormData) {
  await requireAdminAuth();

  const parsed = deleteMasterSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsed.success) redirect("/masters?error=invalid_input");

  const linkExists = (await db.select({ id: tags.id }).from(tags).where(eq(tags.id, parsed.data.id)).limit(1))[0];

  if (!linkExists) redirect("/masters?error=not_found");

  await db.delete(tags).where(eq(tags.id, parsed.data.id));

  revalidatePath("/masters");
  revalidatePath("/");
  redirect("/masters");
}

export async function runOfficialAutoPostAction(formData: FormData) {
  await requireAdminAuth();

  const parsed = runOfficialPostSchema.safeParse({
    force: String(formData.get("force") ?? "1"),
    languagePrompt: String(formData.get("languagePrompt") ?? ""),
    libraryPrompt: String(formData.get("libraryPrompt") ?? "")
  });

  if (!parsed.success) redirect("/official-posts?status=invalid_input");

  const force = parsed.data.force === "1";
  const libraries = parsed.data.libraryPrompt
    .split(/[,\n]/)
    .map((value) => value.trim().replace(/^#/, "").slice(0, 40))
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((x) => x.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 6);

  try {
    const result = await createAutomatedOfficialPost({
      source: "manual",
      force,
      prompt:
        parsed.data.languagePrompt || libraries.length > 0
          ? {
              language: parsed.data.languagePrompt || undefined,
              libraries
            }
          : undefined
    });
    revalidatePath("/");
    revalidatePath("/official-posts");

    const query = new URLSearchParams({ status: result.status });
    if (result.status === "created") {
      query.set("publicId", result.publicId);
      query.set("language", result.language);
    } else {
      query.set("reason", result.reason);
      query.set("nextRunAt", result.nextRunAt);
    }
    redirect(`/official-posts?${query.toString()}`);
  } catch {
    redirect("/official-posts?status=error");
  }
}

export async function deleteOfficialPostAction(formData: FormData) {
  await requireAdminAuth();

  const parsed = deleteOfficialPostSchema.safeParse({
    postPublicId: String(formData.get("postPublicId") ?? "")
  });

  if (!parsed.success) redirect("/official-posts?delete=invalid_input");

  const existing = (
    await db
      .select({ id: posts.id })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(posts.publicId, parsed.data.postPublicId), eq(users.handle, env.officialPostHandle)))
      .limit(1)
  )[0];

  if (!existing) redirect("/official-posts?delete=not_found");

  await db.delete(posts).where(eq(posts.id, existing.id));
  revalidatePath("/");
  revalidatePath("/official-posts");
  redirect("/official-posts?delete=success");
}
