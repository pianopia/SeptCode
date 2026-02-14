import React, { Fragment, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/** 言語名を表示向けに正規化する */
function normalizeLang(language: string): string {
  const l = language.toLowerCase().trim();
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript",
    react: "JavaScript",
    py: "Python",
    sh: "Shell",
    zsh: "Bash",
    yml: "YAML",
    md: "Markdown",
    htm: "HTML",
    "c++": "C++",
    objc: "Objective-C",
    rs: "Rust",
    rb: "Ruby",
    kt: "Kotlin",
    regex: "Regex",
    git: "Git",
    glsl: "GLSL"
  };
  return map[l] ?? language;
}

export function CodeRenderer({
  language,
  code
}: {
  language: string;
  code: string;
}) {
  const lang = useMemo(() => normalizeLang(language), [language]);
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{lang || "Code"}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          {code.split("\n").map((line, lineIndex) => (
            <Text key={`line-${lineIndex}`} style={styles.code}>
              {tokenizeLine(line, language).map((token, tokenIndex) => (
                <Fragment key={`tok-${lineIndex}-${tokenIndex}`}>
                  <Text style={tokenStyle(token.type)}>{token.text}</Text>
                </Fragment>
              ))}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

type TokenType = "plain" | "keyword" | "string" | "number" | "comment";

type Token = {
  text: string;
  type: TokenType;
};

const COMMON_KEYWORDS = new Set([
  "if",
  "else",
  "for",
  "while",
  "return",
  "function",
  "const",
  "let",
  "var",
  "class",
  "new",
  "import",
  "from",
  "export",
  "default",
  "try",
  "catch",
  "finally",
  "throw",
  "switch",
  "case",
  "break",
  "continue",
  "extends",
  "implements",
  "public",
  "private",
  "protected",
  "static",
  "async",
  "await",
  "null",
  "undefined",
  "true",
  "false",
  "def",
  "lambda",
  "elif",
  "pass",
  "raise",
  "in",
  "and",
  "or",
  "not",
  "None",
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP",
  "ORDER",
  "BY",
  "INSERT",
  "UPDATE",
  "DELETE",
  "JOIN",
  "LIMIT",
  "CREATE",
  "TABLE"
]);

function commentPrefixForLanguage(language: string) {
  const l = language.toLowerCase();
  if (l.includes("python") || l.includes("shell") || l.includes("bash") || l.includes("yaml")) return "#";
  if (l.includes("sql")) return "--";
  return "//";
}

function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = [];
  const commentPrefix = commentPrefixForLanguage(language);
  const commentIndex = line.indexOf(commentPrefix);
  const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : "";

  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+|[^\sA-Za-z_]+)/g;
  for (const match of codePart.matchAll(re)) {
    const text = match[0];
    if (!text) continue;
    if (match[1]) {
      tokens.push({ text, type: "string" });
      continue;
    }
    if (match[2]) {
      tokens.push({ text, type: "number" });
      continue;
    }
    if (match[3]) {
      const isKeyword = COMMON_KEYWORDS.has(text) || COMMON_KEYWORDS.has(text.toUpperCase());
      tokens.push({ text, type: isKeyword ? "keyword" : "plain" });
      continue;
    }
    tokens.push({ text, type: "plain" });
  }

  if (commentPart) {
    tokens.push({ text: commentPart, type: "comment" });
  }
  if (tokens.length === 0) return [{ text: line, type: "plain" }];
  return tokens;
}

function tokenStyle(type: TokenType) {
  switch (type) {
    case "keyword":
      return styles.tokenKeyword;
    case "string":
      return styles.tokenString;
    case "number":
      return styles.tokenNumber;
    case "comment":
      return styles.tokenComment;
    default:
      return styles.tokenPlain;
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2d5a",
    overflow: "hidden",
    backgroundColor: "#0a0f1d"
  },
  labelRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#1f2d5a",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  label: {
    color: "#87d9ff",
    fontSize: 11,
    fontWeight: "700"
  },
  scrollContent: {
    padding: 10
  },
  code: {
    color: "#dce6ff",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace"
  },
  tokenPlain: {
    color: "#dce6ff"
  },
  tokenKeyword: {
    color: "#7dd3fc"
  },
  tokenString: {
    color: "#86efac"
  },
  tokenNumber: {
    color: "#f9a8d4"
  },
  tokenComment: {
    color: "#94a3b8"
  }
});
