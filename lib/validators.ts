import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name cannot be empty")
    .max(120, "Folder name too long")
    .regex(/^[^<>:"/\\|?*]+$/, "Folder name contains invalid characters"),
  parentId: z.string().nullable().optional(),
});

export const renameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(255, "Name too long")
    .regex(/^[^<>:"/\\|?*]+$/, "Name contains invalid characters"),
});

export const moveSchema = z.object({
  folderId: z.string().nullable(),
});

export const shareLinkSchema = z.object({
  permission: z.enum(["VIEW", "DOWNLOAD"]).default("VIEW"),
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
  maxDownloads: z.number().int().min(1).max(10000).nullable().optional(),
});

export const fileUploadMetaSchema = z.object({
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().default("application/octet-stream"),
  sizeBytes: z.number().positive(),
  folderId: z.string().nullable().optional(),
});
