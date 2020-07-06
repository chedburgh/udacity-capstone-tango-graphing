"use strict";
import * as AWS from "aws-sdk";
import { createLogger } from "../utils/logger";

const AWSXRay = require("aws-xray-sdk");
const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger("fileStorage");

export class S3Storage {
  private bucketName: string;
  private readonly s3 = new XAWS.S3({ signatureVersion: "v4" });
  private urlExpiration = process.env.SIGNED_URL_EXPIRATION;

  constructor(bucket: string) {
    this.bucketName = bucket;
  }

  storageLocation() {
    return this.bucketName;
  }

  getBucketUrl() {
    return `https://${this.bucketName}.s3.amazonaws.com`;
  }

  async uploadFile(
    filename: string,
    data: any,
    content: string
  ): Promise<void> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: filename,
        Body: data,
        ContentType: content,
      };

      await this.s3.putObject(params).promise();
      logger.info(`File saved to S3 bucket ${this.bucketName}`);
    } catch (error) {
      logger.error(
        `Error uploading ${filename} to S3 bucket ${this.bucketName}: Error: ${error}`
      );

      throw error;
    }
  }

  getSignedDownloadUrl(filename: string) {
    return this.s3.getSignedUrl("getObject", {
      Bucket: this.bucketName,
      Key: filename,
      Expires: Number(this.urlExpiration),
    });
  }

  async deleteFile(filename: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: filename,
    });

    logger.info(`Deleted file ${filename} from S3 bucket ${this.bucketName}`);
  }
}
