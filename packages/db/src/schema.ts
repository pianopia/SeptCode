import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio").default(""),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  premise1: text("premise_1").notNull(),
  premise2: text("premise_2").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  version: text("version").default("latest"),
  aiSummary: text("ai_summary").default(""),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  kind: text("kind", { enum: ["library", "language", "version", "topic"] }).notNull()
});

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" })
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] })
  })
);

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});

export const likes = sqliteTable(
  "likes",
  {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.userId] })
  })
);

export const follows = sqliteTable(
  "follows",
  {
    followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    noSelfFollow: uniqueIndex("follows_unique_pair").on(t.followerId, t.followingId)
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments)
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes)
}));
