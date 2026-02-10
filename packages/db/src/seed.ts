import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { comments, follows, likes, postTags, posts, tags, users } from "./schema";

const tursoUrl = process.env.TURSO_DATABASE_URL ?? "";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  throw new Error("TURSO_DATABASE_URL が未設定です。`.env` もしくは `web/.env.local` を設定してください。");
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken
});

const db = drizzle(client);

type SnippetTemplate = {
  language: string;
  version: string;
  tags: string[];
  premise1: string;
  premise2: string;
  aiSummary: string;
  code: string;
};

const userSeeds = [
  { name: "Shou", handle: "shou_dev", email: "shou@example.com", bio: "TypeScriptと設計が好き" },
  { name: "Aki", handle: "aki_codes", email: "aki@example.com", bio: "Pythonとデータ処理担当" },
  { name: "Mina", handle: "mina_ui", email: "mina@example.com", bio: "CSSとフロントエンド" },
  { name: "Ren", handle: "ren_backend", email: "ren@example.com", bio: "GoとSQL中心" },
  { name: "Kou", handle: "kou_rust", email: "kou@example.com", bio: "Rust勉強中" },
  { name: "Nana", handle: "nana_graph", email: "nana@example.com", bio: "図解とMermaid" }
];

const templates: SnippetTemplate[] = [
  {
    language: "TypeScript",
    version: "v5",
    tags: ["typescript", "react", "hooks"],
    premise1: "入力遅延を短く実装したい",
    premise2: "依存配列を明示して安全にしたい",
    aiSummary: "useEffectでタイマーを管理し、再描画を抑える構成です。",
    code: [
      "const useDebounce = (v: string, d = 300) => {",
      "  const [value, setValue] = useState(v);",
      "  useEffect(() => {",
      "    const t = setTimeout(() => setValue(v), d);",
      "    return () => clearTimeout(t);",
      "  }, [v, d]);",
      "  return value; };"
    ].join("\\n")
  },
  {
    language: "Python",
    version: "3.12",
    tags: ["python", "script", "cli"],
    premise1: "重複行を除外して件数だけ知りたい",
    premise2: "標準入力をそのまま使いたい",
    aiSummary: "集合を使って重複を除外し、行数を高速に集計します。",
    code: [
      "import sys",
      "lines = [l.strip() for l in sys.stdin if l.strip()]",
      "unique = set(lines)",
      "print(f\\\"input={len(lines)}\\\")",
      "print(f\\\"unique={len(unique)}\\\")",
      "for s in sorted(unique)[:3]:",
      "    print(s)"
    ].join("\\n")
  },
  {
    language: "SQL",
    version: "sqlite",
    tags: ["sql", "sqlite", "analytics"],
    premise1: "最近7日の投稿数を出したい",
    premise2: "ユーザーごとの件数で確認したい",
    aiSummary: "日付条件で範囲を絞り、group byでユーザー別集計を行います。",
    code: [
      "SELECT user_id, COUNT(*) AS c",
      "FROM posts",
      "WHERE created_at >= datetime('now', '-7 day')",
      "GROUP BY user_id",
      "ORDER BY c DESC",
      "LIMIT 10;",
      "-- sqlite"
    ].join("\\n")
  },
  {
    language: "Shell",
    version: "bash",
    tags: ["shell", "ops", "tooling"],
    premise1: "ポート3000を使っているプロセスを止めたい",
    premise2: "ワンコマンドで再起動準備したい",
    aiSummary: "lsofでPIDを抽出し、killで解放する基本パターンです。",
    code: [
      "pid=$(lsof -t -i:3000)",
      "if [ -n \\\"$pid\\\" ]; then",
      "  kill -9 $pid",
      "  echo \\\"killed $pid\\\"",
      "else",
      "  echo \\\"no process\\\"",
      "fi"
    ].join("\\n")
  },
  {
    language: "Rust",
    version: "1.81",
    tags: ["rust", "error-handling", "cli"],
    premise1: "Resultを明示してエラーを返したい",
    premise2: "panicを避けて終了コード管理したい",
    aiSummary: "?演算子とmatchを使ったRustらしい失敗処理です。",
    code: [
      "fn parse(v: &str) -> Result<i32, String> {",
      "  let n = v.parse::<i32>().map_err(|_| \\\"bad\\\".to_string())?;",
      "  if n < 0 { return Err(\\\"negative\\\".to_string()); }",
      "  Ok(n)",
      "}",
      "let x = parse(\\\"42\\\")?;",
      "println!(\\\"{}\\\", x);"
    ].join("\\n")
  },
  {
    language: "Mermaid",
    version: "11",
    tags: ["mermaid", "diagram", "flow"],
    premise1: "処理フローを投稿内で共有したい",
    premise2: "コードとしてレビュー可能にしたい",
    aiSummary: "Mermaid記法をそのまま保存し、可視化用に再利用できます。",
    code: [
      "flowchart LR",
      "A[Input] --> B{Valid?}",
      "B -->|yes| C[Save]",
      "B -->|no| D[Reject]",
      "C --> E[Notify]",
      "D --> E",
      "E --> F[Done]"
    ].join("\\n")
  }
];

function detectTagKind(tagName: string, language: string, version: string): "library" | "language" | "version" | "topic" {
  const t = tagName.toLowerCase();
  if (t === language.toLowerCase()) return "language";
  if (t === version.toLowerCase() || /^v?\\d/.test(t)) return "version";
  if (["diagram", "flow", "analytics", "tooling", "hooks", "error-handling"].includes(t)) return "topic";
  return "library";
}

async function main() {
  console.log("Seeding started...");

  await db.delete(postTags);
  await db.delete(comments);
  await db.delete(likes);
  await db.delete(follows);
  await db.delete(posts);
  await db.delete(tags);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("password123", 10);

  const createdUsers = await db
    .insert(users)
    .values(userSeeds.map((u) => ({ ...u, passwordHash })))
    .returning({ id: users.id, handle: users.handle });

  const postRows = [] as Array<{ id: number; publicId: string; userId: number; tags: string[]; language: string; version: string }>;

  for (let i = 0; i < 30; i += 1) {
    const t = templates[i % templates.length];
    const author = createdUsers[i % createdUsers.length];
    const created = await db
      .insert(posts)
      .values({
        publicId: crypto.randomUUID(),
        userId: author.id,
        premise1: `${t.premise1} (${i + 1})`,
        premise2: t.premise2,
        code: t.code,
        language: t.language,
        version: t.version,
        aiSummary: t.aiSummary
      })
      .returning({ id: posts.id, publicId: posts.publicId, userId: posts.userId });

    postRows.push({ ...created[0], tags: t.tags, language: t.language, version: t.version });
  }

  const allTagNames = Array.from(new Set(postRows.flatMap((p) => p.tags)));
  for (const tagName of allTagNames) {
    const sample = postRows.find((p) => p.tags.includes(tagName));
    if (!sample) continue;

    await db.insert(tags).values({
      name: tagName,
      kind: detectTagKind(tagName, sample.language, sample.version)
    });
  }

  const createdTags = await db.select({ id: tags.id, name: tags.name }).from(tags);
  const tagMap = new Map(createdTags.map((t) => [t.name, t.id]));

  for (const post of postRows) {
    for (const tagName of post.tags) {
      const tagId = tagMap.get(tagName);
      if (!tagId) continue;
      await db.insert(postTags).values({ postId: post.id, tagId });
    }
  }

  const likeRows: Array<{ postId: number; userId: number }> = [];
  const commentRows: Array<{ postId: number; userId: number; body: string }> = [];

  for (let i = 0; i < postRows.length; i += 1) {
    const post = postRows[i];
    const likerA = createdUsers[(i + 1) % createdUsers.length];
    const likerB = createdUsers[(i + 2) % createdUsers.length];
    if (likerA.id !== post.userId) likeRows.push({ postId: post.id, userId: likerA.id });
    if (likerB.id !== post.userId) likeRows.push({ postId: post.id, userId: likerB.id });

    if (i % 2 === 0) {
      const commenter = createdUsers[(i + 3) % createdUsers.length];
      commentRows.push({
        postId: post.id,
        userId: commenter.id,
        body: `参考になりました。投稿 #${i + 1} を試してみます。`
      });
    }
  }

  if (likeRows.length) await db.insert(likes).values(likeRows);
  if (commentRows.length) await db.insert(comments).values(commentRows);

  const followRows: Array<{ followerId: number; followingId: number }> = [];
  for (let i = 0; i < createdUsers.length; i += 1) {
    const me = createdUsers[i];
    const next = createdUsers[(i + 1) % createdUsers.length];
    const next2 = createdUsers[(i + 2) % createdUsers.length];
    if (me.id !== next.id) followRows.push({ followerId: me.id, followingId: next.id });
    if (me.id !== next2.id) followRows.push({ followerId: me.id, followingId: next2.id });
  }
  if (followRows.length) await db.insert(follows).values(followRows);

  console.log(`Seed completed: users=${createdUsers.length}, posts=${postRows.length}, tags=${createdTags.length}`);
  console.log("Demo password for all users: password123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
