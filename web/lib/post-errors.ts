import type { z } from "zod";

const FIELD_LABELS: Record<string, string> = {
  premiseText: "前提文",
  code: "コード",
  language: "言語",
  version: "バージョン",
  tags: "タグ"
};

export const DEFAULT_POST_ERROR_MESSAGE = "投稿に失敗しました。入力内容を確認してください。";

export function buildInvalidPostRedirect(message?: string, path = "/") {
  const query = new URLSearchParams({
    error: "invalid_post",
    post_error: message && message.trim().length > 0 ? message : DEFAULT_POST_ERROR_MESSAGE
  });
  return `${path}?${query.toString()}`;
}

export function resolveCreatePostErrorMessage(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return DEFAULT_POST_ERROR_MESSAGE;

  const topLevelPath = String(issue.path[0] ?? "");
  const label = FIELD_LABELS[topLevelPath];

  if (issue.code === "invalid_type" && label) {
    return `${label}を入力してください`;
  }

  if (issue.code === "too_small" && label) {
    return `${label}を入力してください`;
  }

  if (typeof issue.message === "string" && issue.message.trim().length > 0) {
    return issue.message;
  }

  return DEFAULT_POST_ERROR_MESSAGE;
}
