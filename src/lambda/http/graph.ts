"use strict";
import "source-map-support/register";
import middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createLogger } from "../../utils/logger";
import { cacheStorage } from "../../middleware/fileStorage";
import { processUrl } from "../../middleware/xmiGraphing";
import { GraphFiles } from "../../models/GraphFiles";
import * as path from "path";

const logger = createLogger("graph");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);
    let url: string = "";
    let format: string = "";

    if (event.queryStringParameters) {
      url = event.queryStringParameters.url;
      format = event.queryStringParameters.format;

      logger.info(`Download url: ${url}`);
      logger.info(`Graph format: ${format}`);

      var formats: Array<string> = ["png", "svg"];

      if (formats.includes(format) == false) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Format not allowed. Must be png, svg, dot.",
          }),
        };
      }
    }

    let filename = path.parse(path.basename(url)).name;
    let graphFiles: GraphFiles;

    try {
      // this function will download the xmi and graph it
      graphFiles = await processUrl(url, format, cacheStorage, filename);
    } catch (error) {
      return {
        statusCode: 500,
        body: `Unable to process url: ${error}`,
      };
    }

    // get a signed url for the image and return this with
    // a redirect. This is preferable to returning the image
    // itself
    const download_url = await cacheStorage.getSignedDownloadUrl(
      path.basename(graphFiles.graphImageUrl)
    );

    logger.info(
      `Fetched url to return for output file: ${path.basename(
        graphFiles.graphImageUrl
      )}`
    );

    return {
      statusCode: 301,
      headers: { Location: download_url },
      body: "",
    };
  }
);

handler.use(cors({ credentials: true }));
