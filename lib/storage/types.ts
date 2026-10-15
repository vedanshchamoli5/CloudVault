import { Readable } from "stream";

export interface StorageResult {
  key: string;
  size: number;
  contentType: string;
}

export interface DownloadResult {
  stream: Readable;
  size: number;
  contentType: string;
}

export interface IStorageProvider {
  name: string;
  upload(key: string, data: Buffer, contentType: string): Promise<StorageResult>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
}
