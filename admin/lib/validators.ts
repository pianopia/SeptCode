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
