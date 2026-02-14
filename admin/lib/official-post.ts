import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { postTags, posts, tags, users } from "@septcode/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

type OfficialPostTriggerSource = "manual" | "cron";

type OfficialSnippetDraft = {
  premise1: string;
  premise2: string;
  code: string;
  language: string;
  version: string;
  tags: string[];
  summary: string;
};

type OfficialPostPrompt = {
  language?: string;
  libraries?: string[];
};

type CreateOfficialPostParams = {
  source: OfficialPostTriggerSource;
  force?: boolean;
  prompt?: OfficialPostPrompt;
};

export type CreateOfficialPostResult =
  | {
    status: "created";
    source: OfficialPostTriggerSource;
    publicId: string;
    language: string;
    createdAt: string;
  }
  | {
    status: "skipped";
    source: OfficialPostTriggerSource;
    reason: "interval_not_elapsed";
    nextRunAt: string;
  };

const MAX_CODE_LINES = 7;

const FALLBACK_SNIPPETS: OfficialSnippetDraft[] = [
  {
    language: "TypeScript",
    version: "5.x",
    tags: ["official", "typescript", "utility", "validation"],
    premise1: "入力値を安全に正規化し、空値を除外したい",
    premise2: "投稿用に短く再利用できる関数へまとめたい",
    summary: "短い正規化関数で入力処理を共通化できます。",
    code: [
      "const normalize = (v: string[]) =>",
      "  [...new Set(v.map((x) => x.trim()).filter(Boolean))]",
      "    .map((x) => x.toLowerCase())",
      "    .slice(0, 8);",
      "",
      "const tags = normalize([' TS ', 'api', 'api']);",
      "console.log(tags);"
    ].join("\n")
  },
  {
    language: "Python",
    version: "3.12",
    tags: ["official", "python", "collections", "tips"],
    premise1: "頻出要素トップNを素早く確認したい",
    premise2: "ログ行の分析を最小コードで行いたい",
    summary: "Counterで頻出分析を7行で実装できます。",
    code: [
      "from collections import Counter",
      "items = ['ts', 'py', 'ts', 'go', 'py', 'ts']",
      "counter = Counter(items)",
      "for name, count in counter.most_common(3):",
      "    print(name, count)",
      "total = sum(counter.values())",
      "print('total', total)"
    ].join("\n")
  },
  {
    language: "Go",
    version: "1.23",
    tags: ["official", "go", "error-handling", "snippet"],
    premise1: "エラーの有無で即時終了したい",
    premise2: "早期リターンを短く統一したい",
    summary: "Goの早期リターンを最小構成で整理します。",
    code: [
      "func must[T any](v T, err error) T {",
      "  if err != nil { panic(err) }",
      "  return v",
      "}",
      "f := must(os.Open(\"data.txt\"))",
      "defer f.Close()",
      "fmt.Println(\"opened\")"
    ].join("\n")
  },
  {
    language: "Rust",
    version: "1.82",
    tags: ["official", "rust", "result", "cli"],
    premise1: "文字列を安全に数値化して範囲検証したい",
    premise2: "失敗時は明示的なエラーを返したい",
    summary: "Resultと?で失敗経路を明確にできます。",
    code: [
      "fn parse(v: &str) -> Result<u32, &'static str> {",
      "  let n = v.parse::<u32>().map_err(|_| \"parse\")?;",
      "  if n > 1000 { return Err(\"too_large\"); }",
      "  Ok(n)",
      "}",
      "let value = parse(\"42\")?;",
      "println!(\"{value}\");"
    ].join("\n")
  },
  {
    language: "SQL",
    version: "sqlite",
    tags: ["official", "sql", "analytics", "sqlite"],
    premise1: "最近24時間の投稿数を言語別で見たい",
    premise2: "軽量な集計SQLをすぐ使いたい",
    summary: "集計と並び替えを一度に行う定番SQLです。",
    code: [
      "SELECT language, COUNT(*) AS total",
      "FROM posts",
      "WHERE created_at >= datetime('now', '-1 day')",
      "GROUP BY language",
      "ORDER BY total DESC",
      "LIMIT 8;",
      "-- sqlite"
    ].join("\n")
  },
  {
    language: "Shell",
    version: "bash",
    tags: ["official", "shell", "ops", "automation"],
    premise1: "失敗時に即停止する安全な実行テンプレートが欲しい",
    premise2: "定期ジョブの入口にそのまま使いたい",
    summary: "set -euo pipefail で事故を抑制できます。",
    code: [
      "set -euo pipefail",
      "log() { printf '[%s] %s\\n' \"$(date +%H:%M:%S)\" \"$1\"; }",
      "log 'start'",
      "curl -fsS \"$TARGET_URL\" >/tmp/resp.txt",
      "wc -c /tmp/resp.txt",
      "log 'done'",
      "rm -f /tmp/resp.txt"
    ].join("\n")
  },
  {
    language: "Java",
    version: "21",
    tags: ["official", "java", "stream", "collection"],
    premise1: "重複を除きつつソート済み一覧を作りたい",
    premise2: "可読性を落とさず短く書きたい",
    summary: "Streamで重複排除と整列を一括処理できます。",
    code: [
      "var list = List.of(\"go\", \"ts\", \"go\", \"rust\");",
      "var sorted = list.stream()",
      "  .map(String::trim)",
      "  .filter(s -> !s.isBlank())",
      "  .distinct().sorted()",
      "  .toList();",
      "System.out.println(sorted);"
    ].join("\n")
  },
  {
    language: "C#",
    version: ".NET 8",
    tags: ["official", "csharp", "linq", "productivity"],
    premise1: "短いデータ整形をLINQでまとめたい",
    premise2: "nullや空文字を簡潔に除外したい",
    summary: "LINQで整形処理を簡潔に連結できます。",
    code: [
      "var src = new[] { \" TS \", \"\", null, \"go\" };",
      "var cleaned = src",
      "  .Where(x => !string.IsNullOrWhiteSpace(x))",
      "  .Select(x => x!.Trim().ToLowerInvariant())",
      "  .Distinct()",
      "  .ToArray();",
      "Console.WriteLine(string.Join(\",\", cleaned));"
    ].join("\n")
  }
];

function clipText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function normalizeCodeToSevenLines(value: string) {
  const lines = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  return lines.slice(0, MAX_CODE_LINES).join("\n");
}

function normalizeTags(rawTags: unknown, language: string, fallbackTags: string[]) {
  const sourceValues =
    Array.isArray(rawTags) && rawTags.length > 0
      ? rawTags.map((tag) => String(tag))
      : typeof rawTags === "string"
        ? rawTags.split(",")
        : fallbackTags;

  const normalized: string[] = [];
  for (const raw of sourceValues) {
    const tag = raw.trim().replace(/^#/, "").slice(0, 40);
    if (!tag) continue;
    const duplicate = normalized.some((existing) => existing.toLowerCase() === tag.toLowerCase());
    if (!duplicate) normalized.push(tag);
    if (normalized.length >= 8) break;
  }

  if (normalized.length === 0) {
    return ["official", language.trim().toLowerCase() || "snippet"];
  }

  if (!normalized.some((tag) => tag.toLowerCase() === "official")) {
    normalized.unshift("official");
  }

  return normalized.slice(0, 8);
}

function computeDefaultSummary(draft: OfficialSnippetDraft) {
  return clipText(`${draft.language}の実用スニペット。${draft.premise1}`, 120);
}

function pickFallbackSnippet(recentLanguages: string[], preferredLanguage?: string) {
  const preferred = preferredLanguage?.trim().toLowerCase();
  if (preferred) {
    const matched = FALLBACK_SNIPPETS.find((snippet) => snippet.language.toLowerCase() === preferred);
    if (matched) {
      return {
        ...matched,
        tags: [...matched.tags]
      };
    }
  }

  const recent = new Set(recentLanguages.map((language) => language.toLowerCase()));
  const unseen = FALLBACK_SNIPPETS.filter((snippet) => !recent.has(snippet.language.toLowerCase()));
  const target = unseen.length > 0 ? unseen[0] : FALLBACK_SNIPPETS[Math.floor(Date.now() / 60000) % FALLBACK_SNIPPETS.length];
  return {
    ...target,
    tags: [...target.tags]
  };
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;
  if (typeof root.output_text === "string" && root.output_text.trim().length > 0) {
    return root.output_text;
  }

  if (!Array.isArray(root.output)) return "";
  for (const outputItem of root.output) {
    if (!outputItem || typeof outputItem !== "object") continue;
    const item = outputItem as Record<string, unknown>;
    if (!Array.isArray(item.content)) continue;
    for (const contentPart of item.content) {
      if (!contentPart || typeof contentPart !== "object") continue;
      const part = contentPart as Record<string, unknown>;
      if (typeof part.text === "string" && part.text.trim().length > 0) {
        return part.text;
      }
    }
  }
  return "";
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeDraft(raw: unknown, fallback: OfficialSnippetDraft): OfficialSnippetDraft {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const language = clipText(String(source.language ?? fallback.language), 40) || fallback.language;
  const version = clipText(String(source.version ?? fallback.version), 40);
  const premise1 = clipText(String(source.premise1 ?? fallback.premise1), 140) || fallback.premise1;
  const premise2 = clipText(String(source.premise2 ?? fallback.premise2), 140) || fallback.premise2;
  const codeRaw = String(source.code ?? fallback.code);
  const code = normalizeCodeToSevenLines(codeRaw) || normalizeCodeToSevenLines(fallback.code);
  const tags = normalizeTags(source.tags, language, fallback.tags);
  const summaryRaw = clipText(String(source.summary ?? ""), 120);

  return {
    language,
    version,
    premise1,
    premise2,
    code,
    tags,
    summary: summaryRaw || computeDefaultSummary({ ...fallback, language, version, premise1, premise2, code, tags })
  };
}

function normalizePrompt(prompt?: OfficialPostPrompt): OfficialPostPrompt {
  const language = clipText(String(prompt?.language ?? ""), 40);
  const libraries = Array.isArray(prompt?.libraries)
    ? prompt.libraries
      .map((value) => clipText(String(value ?? "").replace(/^#/, ""), 40))
      .filter((value) => value.length > 0)
      .filter((value, index, values) => values.findIndex((x) => x.toLowerCase() === value.toLowerCase()) === index)
      .slice(0, 6)
    : [];
  return {
    language: language || undefined,
    libraries
  };
}

function applyPromptToDraft(draft: OfficialSnippetDraft, prompt?: OfficialPostPrompt): OfficialSnippetDraft {
  const normalizedPrompt = normalizePrompt(prompt);
  const finalLanguage = normalizedPrompt.language ?? draft.language;
  const normalizedTags = normalizeTags(draft.tags, finalLanguage, draft.tags);
  const promptLibraries = normalizedPrompt.libraries ?? [];

  const mergedTagSource = [
    ...normalizedTags,
    ...promptLibraries.map((value) => value.toLowerCase()),
    finalLanguage.toLowerCase()
  ];

  return {
    ...draft,
    language: finalLanguage,
    tags: normalizeTags(mergedTagSource, finalLanguage, draft.tags)
  };
}

async function generateDraftWithAI(recentLanguages: string[], fallback: OfficialSnippetDraft, prompt?: OfficialPostPrompt) {
  if (!process.env.OPENAI_API_KEY) return null;

  const recentHint = recentLanguages.length > 0 ? recentLanguages.join(", ") : "なし";
  const normalizedPrompt = normalizePrompt(prompt);
  const promptHints: string[] = [];

  if (normalizedPrompt.language) {
    promptHints.push(`- language は「${normalizedPrompt.language}」を最優先で選ぶ`);
  }
  if (normalizedPrompt.libraries && normalizedPrompt.libraries.length > 0) {
    promptHints.push(`- code には次のライブラリ/フレームワークのいずれかを使う: ${normalizedPrompt.libraries.join(", ")}`);
  }

  const promptText = [
    "SeptCode運営公式の自動投稿を生成してください。",
    "出力はJSONオブジェクト1つのみで返してください（前置き・コードフェンス禁止）。",
    "必須キー: premise1, premise2, code, language, version, tags, summary",
    "制約:",
    "- code は実用的な内容で 7 行以内",
    "- premise1 / premise2 は各50文字以内。機能についてのみ記載してください。SeptCodeの公式投稿ということは入れないでください",
    "- tags は文字列配列で最大8件、先頭に official を含める",
    "- language は最近投稿と重複しすぎないこと",
    ...promptHints,
    `最近使ったlanguage: ${recentHint}`,
    "フォーマット例:",
    '{"premise1":"...","premise2":"...","code":"line1\\nline2","language":"TypeScript","version":"5.x","tags":["official","typescript"],"summary":"..."}'
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [{ role: "user", content: promptText }],
        max_output_tokens: 600
      })
    });

    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const text = extractResponseText(payload);
    if (!text) return null;

    const jsonBlock = extractFirstJsonObject(text);
    if (!jsonBlock) return null;

    const parsed = JSON.parse(jsonBlock) as unknown;
    return normalizeDraft(parsed, fallback);
  } catch {
    return null;
  }
}

function parseDbTimestamp(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(value);
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

async function ensureOfficialUser() {
  const existing = (
    await db
      .select({ id: users.id, handle: users.handle, email: users.email })
      .from(users)
      .where(eq(users.handle, env.officialPostHandle))
      .limit(1)
  )[0];
  if (existing) return existing;

  let email = env.officialPostEmail;
  const emailTaken = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
  if (emailTaken) {
    email = `${env.officialPostHandle}+${Date.now()}@septcode.local`;
  }

  const disabledPassword = `${env.authSecret}:${crypto.randomUUID()}:${Date.now()}`;
  const passwordHash = await bcrypt.hash(disabledPassword, 12);

  const created = await db
    .insert(users)
    .values({
      name: env.officialPostName,
      handle: env.officialPostHandle,
      email,
      passwordHash,
      bio: "SeptCode運営公式アカウント（自動投稿）"
    })
    .returning({ id: users.id, handle: users.handle, email: users.email });

  return created[0];
}

async function getRecentOfficialLanguages(userId: number, limit = 6) {
  const rows = await db
    .select({ language: posts.language })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
  return rows.map((row) => row.language).filter((language) => language.trim().length > 0);
}

async function getLatestOfficialPost(userId: number) {
  return (
    await db
      .select({ id: posts.id, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(1)
  )[0];
}

export async function createAutomatedOfficialPost({
  source,
  force = false,
  prompt
}: CreateOfficialPostParams): Promise<CreateOfficialPostResult> {
  const officialUser = await ensureOfficialUser();

  if (!force) {
    const latest = await getLatestOfficialPost(officialUser.id);
    if (latest && env.officialPostIntervalMinutes > 0) {
      const latestAt = parseDbTimestamp(latest.createdAt);
      const nextRunAt = new Date(latestAt.getTime() + env.officialPostIntervalMinutes * 60_000);
      if (Date.now() < nextRunAt.getTime()) {
        return {
          status: "skipped",
          source,
          reason: "interval_not_elapsed",
          nextRunAt: nextRunAt.toISOString()
        };
      }
    }
  }

  const recentLanguages = await getRecentOfficialLanguages(officialUser.id);
  const normalizedPrompt = normalizePrompt(prompt);
  const fallback = applyPromptToDraft(pickFallbackSnippet(recentLanguages, normalizedPrompt.language), normalizedPrompt);
  const generated =
    applyPromptToDraft((await generateDraftWithAI(recentLanguages, fallback, normalizedPrompt)) ?? fallback, normalizedPrompt);

  const created = await db
    .insert(posts)
    .values({
      publicId: crypto.randomUUID(),
      userId: officialUser.id,
      premise1: generated.premise1,
      premise2: generated.premise2,
      code: generated.code,
      language: generated.language,
      version: generated.version || null,
      aiSummary: generated.summary
    })
    .returning({
      id: posts.id,
      publicId: posts.publicId,
      createdAt: posts.createdAt
    });

  const post = created[0];
  await replacePostTags(post.id, generated.tags, generated.language);

  return {
    status: "created",
    source,
    publicId: post.publicId,
    language: generated.language,
    createdAt: post.createdAt
  };
}
