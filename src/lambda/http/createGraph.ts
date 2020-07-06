"use strict";
import "source-map-support/register";
import middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserId } from "../utils/utils";
import { createLogger } from "../../utils/logger";
import { CreateGraphRequest } from "../../requests/createGraphRequest";
import { createGraph } from "../../middleware/graphAccess";
import { GraphItem } from "../../models/GraphItem";

const logger = createLogger("createGraph");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);

    const graphRequest: CreateGraphRequest = JSON.parse(event.body!);
    const userId = getUserId(event);
    let graphItem: GraphItem;

    try {
      // hand request to middleware
      graphItem = await createGraph(userId, graphRequest);
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
