import "source-map-support/register";
import middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserId } from "../utils/utils";
import { createLogger } from "../../utils/logger";
import { getGraphs } from "../../middleware/graphAccess";

const logger = createLogger("getGraphs");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);
    const userId = getUserId(event);

    // hand request to the middleware
    const items = await getGraphs(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: items,
      }),
    };
  }
);

handler.use(cors({ credentials: true }));
