import { LambdaLog } from "lambda-log"; // Use ES module import


export const lambda_handler = async (event, context) => {
  try {
    for await (const record of event.Records) {
      await messageHandler(JSON.parse(record.body), context);
    }
    logger.info(JSON.stringify({ event, context }));
  } catch (error) {
    log.error(error);
    throw error;

  }

};

export const messageHandler = async (event, context) => {
  try {
    const logger = new LambdaLog();

    logger.options.meta.correlationId = event.detail.header.correlationId;
    logger.options.meta.eventId = event.id;
    logger.options.meta.functionName = context.functionName;
    logger.options.meta.requestId = context.awsRequestId;
    logger.info(`Processando o beneficio ${JSON.stringify(event)}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

  } catch (error) {
    log.error(error);
    throw error;

  }

}
