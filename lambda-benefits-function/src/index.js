import { LambdaLog } from "lambda-log"; // Use ES module import


export const lambda_handler = async (event, context) => {

  for await (const record of event.Records) {
    await messageHandler(JSON.parse(record.body), context);
  }

};

export const messageHandler = async (event, context) => {
  const logger = new LambdaLog();
  logger.options.meta.correlationId = event.detail.header.correlationId;
  logger.options.meta.eventId = event.id;
  logger.options.meta.functionName = context.functionName;
  logger.options.meta.requestId = context.awsRequestId;
  try {
    logger.info(`TCC - Log FunctionName: ${context.functionName} EventSource: ${event.source} CorrelationId: ${event.detail.header.correlationId}`);
    await new Promise((resolve) => setTimeout(resolve, 150));
  } catch (error) {
    logger.error(error);
    throw error;
  }

}
