"use strict";
import "source-map-support/register";
import middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserId } from "../utils/utils";
import { createLogger } from "../../utils/logger";
import { UpdateGraphRequest } from "../../requests/updateGraphRequest";
import { updateGraph, graphIdValid } from "../../middleware/graphAccess";
import { GraphItem } from "../../models/GraphItem";

const logger = createLogger("createGraph");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);

    const updateRequest: UpdateGraphRequest = JSON.parse(event.body!);
    const userId = getUserId(event);
    const graphId = event.pathParameters!.graphId;

    if (!graphId) {
      logger.error("No graphId supplied, returning 400");
    }

    if (!(await graphIdValid(userId, graphId))) {
      return {
        statusCode: 400,
        body: "Invalid graphId in request",
      };
    }

    let graphItem: GraphItem;

    try {
      // hand request to the middleware
      graphItem = await updateGraph(userId, graphId, updateRequest);
    } catch (error) {
      return {
        statusCode: 500,
        body: `Error creating graph: ${error}`,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ graph: graphItem }),
    };
  }
);

handler.use(cors({ credentials: true }));
