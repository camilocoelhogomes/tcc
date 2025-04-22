import { LambdaLog } from "lambda-log";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
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
    logger.error(`TCC - idepotency check for correlationId ${event.detail.header.correlationId} failed: ${error}`, error);
    return;
  }

}

export const idepotencyCheck = async (eventId, lambdaName, logger) => {
  if (process.env.IDEPONCY !== "TRUE") {
    return;
  }
  logger.info(`TCC - Log IdepotencyCheck: ${lambdaName} EventId: ${eventId}`);
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // Current time + 24 hours in seconds

  const params = {
    TableName: "IdepotencyTable", // Ensure this matches your DynamoDB table name
    Item: {
      pk: { S: eventId }, // Partition key
      sk: { S: lambdaName }, // Sort key
      ttl: { N: ttl.toString() }, // TTL in seconds
    },
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensures idempotency
  };

  const command = new PutItemCommand(params);
  return await client.send(command);
};
