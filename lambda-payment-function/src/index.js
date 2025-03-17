import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { LambdaLog } from "lambda-log"; // Use ES module import
const eventBridgeClient = new EventBridgeClient();

export const lambda_handler = async (event, context) => {
  const logger = new LambdaLog();
  logger.info({ event, context });


  try {
    const entries = event.Records.map(r => recordHandler(r, context));
    logger.info(entries)
    const putEventsComand = {
      Entries: entries,
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

export const recordHandler = (event, context) => {
  const logger = new LambdaLog();

  const correlationId = event.messageAttributes.correlationId.stringValue;
  logger.options.meta.correlationId = correlationId
  logger.options.meta.functionName = context.functionName;
  logger.options.meta.requestId = context.awsRequestId;
  logger.info(`TCC - Log FunctionName: ${context.functionName} CorrelationId: ${correlationId}`);
  logger.info({ event, context })
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
  logger.info(eventMapped);
  return eventMapped;
}