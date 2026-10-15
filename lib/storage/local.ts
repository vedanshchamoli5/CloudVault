import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { IStorageProvider, StorageResult, DownloadResult } from "./types";

export class LocalStorageProvider implements IStorageProvider {
  public name = "local";
  private uploadDir: string;
  private secret: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), "uploads");
    this.secret = process.env.AUTH_SECRET || "cloudvault_local_storage_secret_key";
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent path traversal attacks
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    return path.join(this.uploadDir, sanitizedKey);
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<StorageResult> {
    const filePath = this.getFilePath(key);
    await fs.promises.writeFile(filePath, data);
    
    // Store metadata sidecar for local content-type
    const metaPath = `${filePath}.meta.json`;
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({ contentType, size: data.length, updatedAt: new Date().toISOString() })
    );

    return {
      key,
      size: data.length,
      contentType,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }

    const stat = await fs.promises.stat(filePath);
    let contentType = "application/octet-stream";

    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await fs.promises.readFile(metaPath, "utf-8"));
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // ignore fallback
      }
    }

    const stream = fs.createReadStream(filePath);
    return {
      stream,
      size: stat.size,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath).catch(() => {});
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }

  generateToken(key: string, action: string, expires: number): string {
    const hmac = crypto.createHmac("sha256", this.secret);
    hmac.update(`${key}:${action}:${expires}`);
    return hmac.digest("hex");
  }

  verifyToken(key: string, action: string, expires: number, token: string): boolean {
    if (Date.now() > expires) return false;
    const expected = this.generateToken(key, action, expires);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    const expires = Date.now() + expiresInSeconds * 1000;
    const token = this.generateToken(key, "download", expires);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/storage/local?key=${encodeURIComponent(key)}&action=download&expires=${expires}&token=${token}`;
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = 900
  ): Promise<string> {
    const expires = Date.now() + expiresInSeconds * 1000;
    const token = this.generateToken(key, "upload", expires);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/storage/local?key=${encodeURIComponent(key)}&action=upload&expires=${expires}&token=${token}&contentType=${encodeURIComponent(contentType)}`;
  }
}
