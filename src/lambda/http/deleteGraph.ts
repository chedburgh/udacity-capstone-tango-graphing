import "source-map-support/register";
import middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserId } from "../utils/utils";
import { createLogger } from "../../utils/logger";
import { deleteGraph, graphIdValid } from "../../middleware/graphAccess";

const logger = createLogger("deleteGraph");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);
    const userId = getUserId(event);
    const graphId = event.pathParameters!.graphId;

    if (!graphId) {
      logger.error("No graphId supplied, returning 400");

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing graphId",
        }),
      };
    }

    if (!(await graphIdValid(userId, graphId))) {
      return {
        statusCode: 400,
        body: "Invalid graphId in request",
      };
    }

    // hand request to the middleware
    await deleteGraph(userId, graphId);

    return {
      statusCode: 204,
      body: "",
    };
  }
);

handler.use(cors({ credentials: true }));
