import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, eq } from "drizzle-orm";
import { comments, follows, likes, postTags, posts, tags, users } from "@septcode/db/schema";
import { createAccessToken, comparePassword, hashPassword, verifyAccessToken } from "./lib/auth";
import { explainCode } from "./lib/ai";
import { db } from "./lib/db";
import { env } from "./lib/env";
import { commentSchema, createPostSchema, loginSchema, registerSchema } from "./lib/validators";
import { getComposerSuggestions, getPostDetail, getProfileByHandle, getProfileById, getTimelinePage } from "./lib/queries";

type AppContext = {
  Variables: {
    userId: number | null;
  };
};

const app = new Hono<AppContext>();

app.use(
  "*",
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

app.use("*", async (c, next) => {
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    c.set("userId", null);
    await next();
    return;
  }

  try {
    const token = auth.slice("Bearer ".length).trim();
    const userId = await verifyAccessToken(token);
    c.set("userId", userId);
  } catch {
    c.set("userId", null);
  }
  await next();
});

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((x) => x.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

function buildPremiseTextFromInput(input: unknown) {
  const obj = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const premise1 = String(obj.premise1 ?? "").trim();
  const premise2 = String(obj.premise2 ?? "").trim();
  const premiseText = String(obj.premiseText ?? "").trim();
  if (premise1 || premise2) return `${premise1}\n${premise2}`;
  return premiseText;
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

function requireAuth(c: { get: (key: "userId") => number | null }) {
  const userId = c.get("userId");
  if (!userId) return null;
  return userId;
}

app.get("/health", (c) => c.json({ ok: true, service: "septcode-api" }));

app.post("/auth/register", async (c) => {
  const input = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return c.json({ error: "invalid_input" }, 400);

  const { name, handle, email, password } = parsed.data;
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists.length > 0) return c.json({ error: "email_taken" }, 409);

  const duplicateHandle = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
  if (duplicateHandle.length > 0) return c.json({ error: "handle_taken" }, 409);

  const passwordHash = await hashPassword(password);
  const created = await db
    .insert(users)
    .values({ name, handle, email, passwordHash })
    .returning({ id: users.id, name: users.name, handle: users.handle, email: users.email });

  const user = created[0];
  const token = await createAccessToken(user.id);
  return c.json({ token, user }, 201);
});

app.post("/auth/login", async (c) => {
  const input = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return c.json({ error: "invalid_input" }, 400);

  const user = (
    await db
      .select({ id: users.id, name: users.name, handle: users.handle, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1)
  )[0];

  if (!user) return c.json({ error: "wrong_credentials" }, 401);
  const ok = await comparePassword(parsed.data.password, user.passwordHash);
  if (!ok) return c.json({ error: "wrong_credentials" }, 401);

  const token = await createAccessToken(user.id);
  return c.json({
    token,
    user: { id: user.id, name: user.name, handle: user.handle, email: user.email }
  });
});

app.get("/auth/me", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const me = await db
    .select({ id: users.id, name: users.name, handle: users.handle, email: users.email, bio: users.bio })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!me[0]) return c.json({ error: "not_found" }, 404);
  return c.json(me[0]);
});

app.get("/timeline", async (c) => {
  const tabParam = c.req.query("tab");
  const pageParam = Number(c.req.query("page") ?? "1");
  const limitParam = Number(c.req.query("limit") ?? "20");
  const qParam = c.req.query("q");
  const tab = tabParam === "following" ? "following" : "for-you";
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;
  const userId = c.get("userId");

  const result = await getTimelinePage({ tab, userId, page, limit, query: qParam });
  return c.json(result);
});

app.get("/composer/suggestions", async (c) => {
  const data = await getComposerSuggestions();
  return c.json(data);
});

app.get("/posts/:publicId", async (c) => {
  const userId = c.get("userId");
  const post = await getPostDetail(c.req.param("publicId"), userId);
  if (!post) return c.json({ error: "not_found" }, 404);
  return c.json(post);
});

app.post("/posts", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const input = await c.req.json().catch(() => null);
  const parsed = createPostSchema.safeParse({
    premiseText: buildPremiseTextFromInput(input),
    code: String((input as Record<string, unknown> | null)?.code ?? ""),
    language: String((input as Record<string, unknown> | null)?.language ?? ""),
    version: String((input as Record<string, unknown> | null)?.version ?? ""),
    tags: String((input as Record<string, unknown> | null)?.tags ?? "")
  });
  if (!parsed.success) return c.json({ error: "invalid_post", details: parsed.error.flatten() }, 400);

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
    .returning({ id: posts.id, publicId: posts.publicId });

  const postId = created[0].id;
  const tagNames = parseTags(parsed.data.tags);
  await replacePostTags(postId, tagNames, parsed.data.language);

  return c.json({ publicId: created[0].publicId }, 201);
});

app.patch("/posts/:publicId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const publicId = c.req.param("publicId");
  const existing = (
    await db
      .select({ id: posts.id, userId: posts.userId, publicId: posts.publicId })
      .from(posts)
      .where(eq(posts.publicId, publicId))
      .limit(1)
  )[0];
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.userId !== userId) return c.json({ error: "forbidden" }, 403);

  const input = await c.req.json().catch(() => null);
  const parsed = createPostSchema.safeParse({
    premiseText: buildPremiseTextFromInput(input),
    code: String((input as Record<string, unknown> | null)?.code ?? ""),
    language: String((input as Record<string, unknown> | null)?.language ?? ""),
    version: String((input as Record<string, unknown> | null)?.version ?? ""),
    tags: String((input as Record<string, unknown> | null)?.tags ?? "")
  });
  if (!parsed.success) return c.json({ error: "invalid_post", details: parsed.error.flatten() }, 400);

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

  return c.json({ ok: true, publicId: existing.publicId });
});

app.delete("/posts/:publicId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const publicId = c.req.param("publicId");
  const existing = (
    await db
      .select({ id: posts.id, userId: posts.userId })
      .from(posts)
      .where(eq(posts.publicId, publicId))
      .limit(1)
  )[0];
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.userId !== userId) return c.json({ error: "forbidden" }, 403);

  await db.delete(posts).where(eq(posts.id, existing.id));
  return c.json({ ok: true });
});

app.post("/posts/:publicId/like", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const publicId = c.req.param("publicId");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.publicId, publicId)).limit(1);
  if (!post[0]) return c.json({ error: "not_found" }, 404);
  const postId = post[0].id;

  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  let liked = false;
  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
  } else {
    await db.insert(likes).values({ postId, userId });
    liked = true;
  }

  const likeCount = await db.select({ value: likes.userId }).from(likes).where(eq(likes.postId, postId));
  return c.json({ liked, likeCount: likeCount.length });
});

app.post("/posts/:publicId/comments", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const publicId = c.req.param("publicId");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.publicId, publicId)).limit(1);
  if (!post[0]) return c.json({ error: "not_found" }, 404);

  const input = await c.req.json().catch(() => null);
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return c.json({ error: "invalid_comment", details: parsed.error.flatten() }, 400);

  await db.insert(comments).values({ postId: post[0].id, userId, body: parsed.data.body });
  return c.json({ ok: true }, 201);
});

app.get("/users/:handle", async (c) => {
  const viewerId = c.get("userId");
  const profile = await getProfileByHandle(c.req.param("handle"), viewerId);
  if (!profile) return c.json({ error: "not_found" }, 404);
  return c.json(profile);
});

app.get("/users/id/:id", async (c) => {
  const viewerId = c.get("userId");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "invalid_user_id" }, 400);

  const profile = await getProfileById(id, viewerId);
  if (!profile) return c.json({ error: "not_found" }, 404);
  return c.json(profile);
});

app.post("/users/:handle/follow", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const target = await db.select({ id: users.id, handle: users.handle }).from(users).where(eq(users.handle, c.req.param("handle"))).limit(1);
  if (!target[0]) return c.json({ error: "not_found" }, 404);
  if (target[0].id === userId) return c.json({ error: "cannot_follow_self" }, 400);

  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingId, target[0].id)))
    .limit(1);

  let following = false;
  if (existing.length > 0) {
    await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, target[0].id)));
  } else {
    await db.insert(follows).values({ followerId: userId, followingId: target[0].id });
    following = true;
  }

  return c.json({ following });
});

app.post("/users/id/:id/follow", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const targetId = Number(c.req.param("id"));
  if (!Number.isInteger(targetId) || targetId <= 0) return c.json({ error: "invalid_user_id" }, 400);
  if (targetId === userId) return c.json({ error: "cannot_follow_self" }, 400);

  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target[0]) return c.json({ error: "not_found" }, 404);

  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingId, targetId)))
    .limit(1);

  let following = false;
  if (existing.length > 0) {
    await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, targetId)));
  } else {
    await db.insert(follows).values({ followerId: userId, followingId: targetId });
    following = true;
  }

  return c.json({ following });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

serve(
  {
    fetch: app.fetch,
    port: env.port
  },
  (info) => {
    console.log(`SeptCode API listening on http://localhost:${info.port}`);
  }
);
