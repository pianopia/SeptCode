import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(40),
  handle: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(64)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64)
});

export const createPostSchema = z.object({
  premiseText: z.string().max(300).default(""),
  code: z.string().min(1),
  language: z.string().max(40).default(""),
  version: z.string().max(40).default(""),
  tags: z.string().max(200).default("")
}).superRefine(({ code, premiseText }, ctx) => {
  const lines = code.split("\n").length;
  if (lines > 7) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "コードは7行以内にしてください"
    });
  }

  const premiseLines = premiseText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (premiseLines.length > 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "前提文は2行以内で入力してください"
    });
  }
  if (premiseLines.some((line) => line.length > 140)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "前提文の各行は140文字以内にしてください"
    });
  }
});

export const commentSchema = z.object({
  postId: z.number().int().positive(),
  postPublicId: z.string().min(1).max(64),
  body: z.string().min(1).max(240)
});

export const deleteCommentSchema = z.object({
  commentId: z.number().int().positive(),
  postPublicId: z.string().min(1).max(64)
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(40),
  bio: z.string().max(300).default("")
});
