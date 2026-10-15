import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { IStorageProvider, StorageResult, DownloadResult } from "./types";

export class S3StorageProvider implements IStorageProvider {
  public name = "s3";
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || "cloudvault-storage";
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadminpassword";
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true" || !!endpoint;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<StorageResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });

    await this.client.send(command);

    return {
      key,
      size: data.length,
      contentType,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File ${key} body is empty`);
    }

    return {
      stream: response.Body as unknown as Readable,
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = 900
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
