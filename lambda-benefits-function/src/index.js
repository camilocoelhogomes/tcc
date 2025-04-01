import { LambdaLog } from "lambda-log";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});

export const lambda_handler = async (event, context) => {

  await Promise.all(event.Records.map(r => messageHandler(JSON.parse(r.body), context)));

};

export const messageHandler = async (event, context) => {
  const logger = new LambdaLog();
  logger.options.meta.correlationId = event.detail.header.correlationId;
  logger.options.meta.eventId = event.id;
  logger.options.meta.functionName = context.functionName;
  logger.options.meta.requestId = context.awsRequestId;
  try {
    await idepotencyCheck(event.detail.header.correlationId, context.functionName, logger);
    logger.info(`TCC - Log FunctionName: ${context.functionName} EventSource: ${event.source} CorrelationId: ${event.detail.header.correlationId}`);
  } catch (error) {
    logger.error(`TCC - idepotency check for correlationId ${event.detail.header.correlationId} failed: ${error}`);
    return;
  }

}

export const idepotencyCheck = async (eventId, lambdaName, logger) => {
  logger.info(`TCC - Log IdepotencyCheck: ${lambdaName} EventId: ${eventId}`);
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const params = {
    TableName: "IdepotencyTable",
    Item: {
      pk: eventId,
      sk: lambdaName,
      ttl: ttl,
    },
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensures idempotency
  };

  return await client.send(new PutCommand(params));
};
