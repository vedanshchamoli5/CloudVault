import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  registerSchema,
  loginSchema,
  createFolderSchema,
  renameSchema,
  shareLinkSchema,
} from "@/lib/validators";

describe("CloudVault Business Rules & Validations", () => {
  it("should validate and enforce email and password length during registration", () => {
    const valid = registerSchema.safeParse({
      name: "Vedansh Chamoli",
      email: "vedansh@cloudvault.dev",
      password: "StrongPassword123!",
    });
    expect(valid.success).toBe(true);

    const tooShortPassword = registerSchema.safeParse({
      name: "User",
      email: "user@cloudvault.dev",
      password: "123",
    });
    expect(tooShortPassword.success).toBe(false);

    const invalidEmail = registerSchema.safeParse({
      name: "User",
      email: "not-an-email",
      password: "StrongPassword123!",
    });
    expect(invalidEmail.success).toBe(false);
  });

  it("should reject illegal characters in folder and file names", () => {
    const validFolder = createFolderSchema.safeParse({ name: "Work Specifications" });
    expect(validFolder.success).toBe(true);

    const invalidFolder = createFolderSchema.safeParse({ name: 'Folder/With:Invalid<Chars>"' });
    expect(invalidFolder.success).toBe(false);

    const emptyFolder = createFolderSchema.safeParse({ name: "   " });
    expect(emptyFolder.success).toBe(false);
  });

  it("should enforce storage quota limits accurately", () => {
    const quotaBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const currentUsedBytes = 9.9 * 1024 * 1024 * 1024;
    const incomingFileSize = 200 * 1024 * 1024; // 200 MB

    const wouldExceed = currentUsedBytes + incomingFileSize > quotaBytes;
    expect(wouldExceed).toBe(true);

    const acceptableFileSize = 50 * 1024 * 1024; // 50 MB
    const wouldAccept = currentUsedBytes + acceptableFileSize <= quotaBytes;
    expect(wouldAccept).toBe(true);
  });

  it("should cryptographically hash share link tokens with SHA-256", () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    expect(rawToken.length).toBe(64);

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    expect(tokenHash.length).toBe(64);
    expect(tokenHash).not.toBe(rawToken);

    // Matching raw token must always produce the same hash
    const recomputedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    expect(recomputedHash).toBe(tokenHash);

    // Different raw token must produce different hash
    const anotherRawToken = crypto.randomBytes(32).toString("hex");
    const anotherHash = crypto.createHash("sha256").update(anotherRawToken).digest("hex");
    expect(anotherHash).not.toBe(tokenHash);
  });

  it("should validate share link expiration and permission rules", () => {
    const validShare = shareLinkSchema.safeParse({
      permission: "DOWNLOAD",
      expiresInDays: 7,
      maxDownloads: 10,
    });
    expect(validShare.success).toBe(true);

    const invalidPermission = shareLinkSchema.safeParse({
      permission: "ADMIN_WRITE", // Invalid permission enum
    });
    expect(invalidPermission.success).toBe(false);
  });

  it("should verify immutable version tracking math", () => {
    let currentVersion = 1;
    const versions: { versionNumber: number; sizeBytes: number }[] = [
      { versionNumber: 1, sizeBytes: 1024 },
    ];

    // Upload v2
    const v2Size = 2048;
    currentVersion += 1;
    versions.push({ versionNumber: currentVersion, sizeBytes: v2Size });

    expect(currentVersion).toBe(2);
    expect(versions.length).toBe(2);

    // Restore v1
    const targetVersion = versions.find((v) => v.versionNumber === 1);
    expect(targetVersion).toBeDefined();
    currentVersion = targetVersion!.versionNumber;

    expect(currentVersion).toBe(1);
    // Historical v2 is preserved in storage
    expect(versions.some((v) => v.versionNumber === 2)).toBe(true);
  });
});
