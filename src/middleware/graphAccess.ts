import * as uuid from "uuid";
import { GraphItem } from "../models/GraphItem";
import { GraphFiles } from "../models/GraphFiles";
import { DynamoDbStorage } from "../dataAccess/dynamoDbStorage";
import { CreateGraphRequest } from "../requests/createGraphRequest";
import { UpdateGraphRequest } from "../requests/updateGraphRequest";
import { createLogger } from "../utils/logger";
import { fileStorage } from "./fileStorage";
import { processUrl } from "./xmiGraphing";
import * as path from "path";

const logger = createLogger("graphAccess");
const dynamoDbStorage = new DynamoDbStorage();

export async function graphIdValid(
  userId: string,
  graphId: string
): Promise<boolean> {
  return await dynamoDbStorage.graphIdExists(userId, graphId);
}

export async function createGraph(
  userId: string,
  createGraphRequest: CreateGraphRequest
): Promise<GraphItem> {
  logger.info(`Attempting to graph ${createGraphRequest.sourceUrl}`);

  let graphFiles: GraphFiles;
  const graphId = uuid.v4();

  try {
    // this function will download the xmi and graph it
    graphFiles = await processUrl(
      createGraphRequest.sourceUrl,
      "png",
      fileStorage,
      graphId
    );
  } catch (error) {
    throw `Graphing failed: ${error}`;
  }

  // create the graph ready for storage, we will return this
  // to the front end also
  const graphItem: GraphItem = {
    userId: userId,
    graphId: graphId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    graphImageUrl: graphFiles.graphImageUrl,
    graphXmiUrl: graphFiles.graphXmiUrl,
    description: createGraphRequest.description,
    name: createGraphRequest.name,
  };

  await dynamoDbStorage.storeGraph(graphItem);
  return graphItem;
}

export async function deleteGraph(
  userId: string,
  graphId: string
): Promise<void> {
  logger.info(`Deleting graphId: ${graphId} for userid: ${userId}`);

  // delete the files in storage
  const graphItem: GraphItem = await dynamoDbStorage.getGraphByGraphId(
    userId,
    graphId
  );

  logger.info(graphItem);

  fileStorage.delete(path.basename(graphItem.graphImageUrl));
  fileStorage.delete(path.basename(graphItem.graphXmiUrl));

  // tidy up the entry in the database
  await dynamoDbStorage.deleteGraph(userId, graphId);
}

export async function getGraphs(userId: string): Promise<GraphItem[]> {
  logger.info(`Getting all graphs for userid: ${userId}`);
  return await dynamoDbStorage.getAllGraphsByUser(userId);
}

export async function getGraph(
  userId: string,
  graphId: string
): Promise<GraphItem> {
  logger.info(`Getting graphId: ${graphId} for userid: ${userId}`);
  return await dynamoDbStorage.getGraphByGraphId(userId, graphId);
}

export async function updateGraph(
  userId: string,
  graphId: string,
  updateGraphRequest: UpdateGraphRequest
): Promise<GraphItem> {
  logger.info(`Updating graphId: ${graphId} for userid: ${userId}`);

  // get the graph item, we are going to remove the existing files in storage
  const graph = await getGraph(userId, graphId);
  graph.updatedAt = new Date().toISOString();

  // if there is a new sourceUrl, then run the graphing to update
  // the files in storage
  if (updateGraphRequest.sourceUrl) {
    fileStorage.delete(path.basename(graph.graphImageUrl));
    fileStorage.delete(path.basename(graph.graphXmiUrl));

    let graphFiles: GraphFiles;

    try {
      // this function will download the xmi and graph it
      graphFiles = await processUrl(
        updateGraphRequest.sourceUrl,
        "png",
        fileStorage,
        graph.graphId
      );
    } catch (error) {
      throw `Graphing failed: ${error}`;
    }

    // update the graph item and use it to update the entry in the db
    graph.graphImageUrl = graphFiles.graphImageUrl;
    graph.graphXmiUrl = graphFiles.graphXmiUrl;
  }

  if (updateGraphRequest.name) {
    graph.name = updateGraphRequest.name;
  }

  if (updateGraphRequest.description) {
    graph.description = updateGraphRequest.description;
  }

  await dynamoDbStorage.updateGraph(userId, graph);
  return graph;
}
