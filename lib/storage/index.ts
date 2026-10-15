import { IStorageProvider } from "./types";
import { S3StorageProvider } from "./s3";
import { LocalStorageProvider } from "./local";

class StorageService {
  private provider: IStorageProvider;

  constructor() {
    const driver = process.env.STORAGE_DRIVER || "local";
    if (driver === "s3") {
      this.provider = new S3StorageProvider();
    } else {
      this.provider = new LocalStorageProvider();
    }
  }

  public getProvider(): IStorageProvider {
    return this.provider;
  }
}

const storageService = new StorageService();
export const storage = storageService.getProvider();
export * from "./types";
