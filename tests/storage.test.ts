import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage/local";
import fs from "fs";
import path from "path";

describe("Storage Abstraction & File System Driver", () => {
  let provider: LocalStorageProvider;
  const testKey = "test_file_sample.txt";

  beforeEach(() => {
    provider = new LocalStorageProvider();
  });

  afterEach(async () => {
    try {
      await provider.delete(testKey);
    } catch {
      // ignore
    }
  });

  it("should upload and download file bytes with integrity", async () => {
    const content = Buffer.from("CloudVault Storage Test Content", "utf-8");
    const result = await provider.upload(testKey, content, "text/plain");

    expect(result.key).toBe(testKey);
    expect(result.size).toBe(content.length);

    const exists = await provider.exists(testKey);
    expect(exists).toBe(true);

    const downloaded = await provider.download(testKey);
    expect(downloaded.size).toBe(content.length);
    expect(downloaded.contentType).toBe("text/plain");

    // Read full stream to ensure it closes properly
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      downloaded.stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      downloaded.stream.on("end", () => resolve());
      downloaded.stream.on("error", (err) => reject(err));
    });

    const downloadedContent = Buffer.concat(chunks).toString("utf-8");
    expect(downloadedContent).toBe("CloudVault Storage Test Content");
  });

  it("should delete uploaded file and clean metadata", async () => {
    const content = Buffer.from("Temporary Delete File", "utf-8");
    await provider.upload(testKey, content, "text/plain");

    let exists = await provider.exists(testKey);
    expect(exists).toBe(true);

    await provider.delete(testKey);
    exists = await provider.exists(testKey);
    expect(exists).toBe(false);
  });

  it("should sanitize keys to prevent directory traversal", async () => {
    const maliciousKey = "../../../etc/passwd";
    const content = Buffer.from("traversal test", "utf-8");
    const result = await provider.upload(maliciousKey, content, "text/plain");

    // Must not write outside the upload directory
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    const targetFile = path.join(uploadsDir, result.key.replace(/[^a-zA-Z0-9_\-\.]/g, "_"));
    expect(fs.existsSync(targetFile)).toBe(true);

    await provider.delete(maliciousKey);
  });

  it("should generate and verify presigned local storage tokens", () => {
    const expires = Date.now() + 60000;
    const token = provider.generateToken("doc.pdf", "download", expires);
    expect(token).toBeDefined();

    const isValid = provider.verifyToken("doc.pdf", "download", expires, token);
    expect(isValid).toBe(true);

    const isActionMismatch = provider.verifyToken("doc.pdf", "upload", expires, token);
    expect(isActionMismatch).toBe(false);

    const isKeyMismatch = provider.verifyToken("other.pdf", "download", expires, token);
    expect(isKeyMismatch).toBe(false);
  });
});
