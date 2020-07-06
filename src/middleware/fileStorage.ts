"use strict";
import { S3Storage } from "../dataAccess/S3Storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("storage");

class Storage {
  private s3Storage: S3Storage;

  constructor(location: string) {
    this.s3Storage = new S3Storage(location);
  }

  async store(filename: string, data: any, content: string): Promise<string> {
    logger.info(`Uploading content ${content} as file ${filename} to ${this.s3Storage.storageLocation()}`);

    await this.s3Storage.uploadFile(filename, data, content);
    return `${this.s3Storage.getBucketUrl()}/${filename}`;
  }

  getDownloadUrl(filename: string) {
    logger.info(
      `Generating url for ${filename} from ${this.s3Storage.storageLocation()}`
    );
    return `${this.s3Storage.getBucketUrl()}/${filename}`;
  }

  getSignedDownloadUrl(filename: string) {
    logger.info(
      `Generating signed url for ${filename} from ${this.s3Storage.storageLocation()}`
    );
    return this.s3Storage.getSignedDownloadUrl(filename);
  }

  async delete(filename: string): Promise<void> {
    logger.info(`Deleting file: ${filename}`);
    return this.s3Storage.deleteFile(filename);
  }
}

const cacheStorage = new Storage(`${process.env.CACHE_BUCKET}`);
const fileStorage = new Storage(`${process.env.STORAGE_BUCKET}`);

export { fileStorage, cacheStorage, Storage };
