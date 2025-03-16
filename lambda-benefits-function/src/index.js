import { LambdaLog } from "lambda-log"; // Use ES module import


export const lambda_handler = async (event, context) => {
  try {
    const logger = new LambdaLog();
    logger.info(JSON.stringify({ event, context }));
  } catch (error) {
    log.error(error);
    throw error;

  }

};
