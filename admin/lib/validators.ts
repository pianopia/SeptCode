import { z } from "zod";

export const adminLoginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1)
});

export const createMasterSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .transform((v) => v.trim()),
  kind: z.enum(["language", "library", "version", "topic"])
});

export const updateMasterSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z
    .string()
    .min(1)
    .max(64)
    .transform((v) => v.trim()),
  kind: z.enum(["language", "library", "version", "topic"])
});

export const deleteMasterSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const runOfficialPostSchema = z.object({
  force: z.enum(["0", "1"]).default("1"),
  languagePrompt: z
    .string()
    .max(64)
    .transform((v) => v.trim()),
  libraryPrompt: z
    .string()
    .max(160)
    .transform((v) => v.trim())
});

export const deleteOfficialPostSchema = z.object({
  postPublicId: z.string().min(1).max(128)
});
