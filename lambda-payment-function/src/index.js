import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { LambdaLog } from "lambda-log"; // Use ES module import
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const eventBridgeClient = new EventBridgeClient();
const client = new DynamoDBClient({});

export const lambda_handler = async (event, context) => {
  const logger = new LambdaLog();
  logger.info({ event, context });


  try {
    const entries = await Promise.all(event.Records.map(r => recordHandler(r, context)));
    const putEventsComand = {
      Entries: entries.filter(entry => entry),
    };

    const result = await eventBridgeClient.send(new PutEventsCommand(putEventsComand));
    if (result.FailedEntryCount > 0) {
      logger.error(`Erro ao publicar evento ${JSON.stringify(result)}`);
      throw result.Entries.filter(entry => entry.ErrorCode);
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const recordHandler = async (event, context) => {
  const logger = new LambdaLog();

  const correlationId = event.messageAttributes.correlationId.stringValue;
  logger.options.meta.correlationId = correlationId
  logger.options.meta.functionName = context.functionName;
  logger.options.meta.requestId = context.awsRequestId;
  logger.info(`TCC - Log FunctionName: ${context.functionName} CorrelationId: ${correlationId}`);
  try {
    await idepotencyCheck(correlationId, context.functionName, logger);
  } catch (error) {
    logger.error(`TCC - idepotency check for correlationId ${correlationId} failed: ${error}`, error);
    logger.error(error);
    return;
  }
  const eventMapped = {
    EventBusName: 'tcc-event-bus',
    Source: context.functionName,
    DetailType: 'payment',
    Detail: JSON.stringify({
      header: {
        correlationId
      },
      body: JSON.parse(event.body)
    }),
  }
  return eventMapped;
}

export const idepotencyCheck = async (eventId, lambdaName, logger) => {
  logger.info(`TCC - Log IdepotencyCheck: ${lambdaName} EventId: ${eventId}`);
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const params = new PutItemCommand({
    TableName: "IdepotencyTable",
    Item: {
      pk: {
        S: eventId,
      },
      sk: {
        s: lambdaName,
      },
      ttl: {
        N: ttl.toString(),
      }
    },
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensures idempotency
  });

  return await client.send(new PutItemCommand(params));
};