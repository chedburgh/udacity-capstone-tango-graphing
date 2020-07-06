import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { GraphItem } from "../models/GraphItem";
import { createLogger } from "../utils/logger";

const logger = createLogger("DynamoDbStorage");
const AWSXRay = require("aws-xray-sdk");
const XAWS = AWSXRay.captureAWS(AWS);

export class DynamoDbStorage {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly graphDataTable = process.env.GRAPH_DATA_TABLE,
    private readonly graphDataLocalIndex = process.env.GRAPH_DATA_LOCAL_INDEX,
    private readonly graphDataGlobalIndex = process.env.GRAPH_DATA_GLOBAL_GRAPHID_INDEX
  ) {}

  async graphIdExists(userId: string, graphId: string): Promise<boolean> {
    logger.info(`Checking userId: ${userId} exists`);

    const result = await this.docClient
      .get({
        TableName: this.graphDataTable!,
        Key: {
          "userId": userId,
          "graphId": graphId
        }
      })
      .promise();

      if (result.Item !== undefined && result.Item !== null) {
        return true;
      }

      return false;
  }

  async getAllGraphsByUser(userId: string): Promise<GraphItem[]> {
    logger.info(`Getting all graph items for userId: ${userId}`);

    const result = await this.docClient
      .query({
        TableName: this.graphDataTable!,
        IndexName: this.graphDataLocalIndex,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
      })
      .promise();

    return result.Items as GraphItem[];
  }

  async getGraphByGraphId(userId: string, graphId: string): Promise<GraphItem> {
    logger.info(`Getting graph: ${graphId} for userId ${userId}`);

    const result = await this.docClient
      .query({
        TableName: this.graphDataTable!,
        IndexName: this.graphDataGlobalIndex,
        KeyConditionExpression: "userId = :userId AND graphId = :graphId",
        ExpressionAttributeValues: { ":userId": userId, ":graphId": graphId },
      })
      .promise();

      logger.info(result);

    return result.Items![0] as GraphItem;
  }

  async storeGraph(graphItem: GraphItem): Promise<void> {
    logger.info(
      `Creating a new graph for userId: ${graphItem.userId} with graphItem: ${graphItem.graphId}`
    );

    await this.docClient
      .put({
        TableName: this.graphDataTable!,
        Item: graphItem,
      })
      .promise();
  }

  async deleteGraph(userId: string, graphId: string): Promise<void> {
    logger.info(
      `Deleting graph for userId: ${userId} with graphId: ${graphId}`
    );

    await this.docClient
      .delete({
        TableName: this.graphDataTable!,
        Key: { userId: userId, graphId: graphId },
      })
      .promise();
  }

  async updateGraph(userId: string, graphItem: GraphItem): Promise<GraphItem> {
    logger.info(`Updating graph with graphId: ${graphItem.graphId}`);

    const result = await this.docClient
      .update({
        TableName: this.graphDataTable!,
        Key: { userId: userId, graphId: graphItem.graphId },
        UpdateExpression:
          "set #graphname = :name, updatedAt = :updatedAt, description = :description, graphImageUrl = :graphImageUrl, graphXmiUrl = :graphXmiUrl",
        ExpressionAttributeValues: {
          ":name": graphItem.name,
          ":updatedAt": graphItem.updatedAt,
          ":description": graphItem.description,
          ":graphImageUrl": graphItem.graphImageUrl,
          ":graphXmiUrl": graphItem.graphXmiUrl,
        },
        ExpressionAttributeNames: {
          "#graphname": "name",
        },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();

    return result.Attributes as GraphItem;
  }
}
