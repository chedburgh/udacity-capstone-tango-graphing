import { createLogger } from "../utils/logger";
import { Storage } from "./fileStorage";
import { GraphFiles } from "../models/GraphFiles";
import axios from "axios";
import got from "got";

const logger = createLogger("xmiGraphing");

// return the filename in the given storage
export async function processUrl(
  sourceUrl: string,
  format: string,
  storage: Storage,
  filename: string
): Promise<GraphFiles> {
  logger.info(`Graphing request: ${sourceUrl} with format: ${format} and filename ${filename}`);

  let data;

  // attempt to download the url we want to graph
  try {
    const response = await axios.get(sourceUrl, {
      timeout: 2000,
      proxy: false,
      responseType: "text",
    });

    data = response.data;
    logger.info(`Downloaded url: ${sourceUrl}`);
  } catch (error) {
    // an error occurred, lets dump lots of info for the logs
    if (error.response) {
      logger.error(error.response.status);
      logger.error(error.response.headers);
    } else if (error.request) {
      logger.error(error.request);
    } else {
      logger.error("Error", error.message);
    }

    // return an error, can not download the file
    throw `Error downloading file: ${error.message}`;
  }

  // get the filename so we can upload it to storage
  let xmiFilename = `${filename}.xmi`;

  // next we upload it to the staging s3 bucket, to make it available to the
  // graphing task
  const staging_url = await storage.store(xmiFilename, data, "text/xml");
  logger.info(`Uploaded file ${xmiFilename} to staging: ${staging_url}`);

  // call the graphing server to graph the device server
  const xmi_url = storage.getDownloadUrl(xmiFilename);
  let graphResponse: any;

  try {
    graphResponse = await got(
      `${process.env.GRAPHING_SERVER_URL}?input_url=${xmi_url}&format=${format}`,
      { responseType: "buffer", method: "GET", encoding: "binary" }
    );
  } catch (error) {
    throw `Error with graph server: ${error.response.body}`;
  }

  // create the output file name
  let imageFilename = `${filename}.${format}`;
  let contentType: string;

  if (format === "svg") {
    contentType = `image/svg+xml`;
  } else {
    contentType = `image/${format}`;
  }

  // upload to storage
  const storage_url = await storage.store(
    imageFilename,
    graphResponse.body,
    contentType!
  );
  logger.info(`Uploaded file ${imageFilename} to storage: ${storage_url}`);

  let graphFiles: GraphFiles = {
    graphImageUrl: storage.getDownloadUrl(imageFilename),
    graphXmiUrl: storage.getDownloadUrl(xmiFilename),
  };

  return graphFiles;
}
