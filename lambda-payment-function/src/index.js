import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { LambdaLog } from "lambda-log"; // Use ES module import
const eventBridgeClient = new EventBridgeClient();

export const lambda_handler = async (event, context) => {
  const logger = new LambdaLog();
  const correlationId = event.requestContext.extendedRequestId;
  logger.options.meta.correlationId = correlationId
  logger.options.meta.functionName = context.functionName;
  logger.options.meta.requestId = context.awsRequestId;
  try {
    const body = JSON.parse(event.body);
    logger.info(JSON.stringify({ body: JSON.parse(event.body) }));
    const putEventsComand = {
      Entries: [
        {
          EventBusName: 'tcc-event-bus',
          Source: context.functionName,
          DetailType: 'payment',
          Detail: JSON.stringify({
            header: {
              correlationId
            },
            body
          }),
        },
      ],
    };
    logger.info(`Publicando evento ${JSON.stringify(putEventsComand)}`);
    const result = await eventBridgeClient.send(new PutEventsCommand(putEventsComand));
    if (result.FailedEntryCount > 0) {
      logger.error(`Erro ao publicar evento ${JSON.stringify(result)}`);
      throw result.Entries.filter(entry => entry.ErrorCode);
    }
    logger.info(`Evento publicado com sucesso ${JSON.stringify(result)}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Evento publicado com sucesso",
        result,
      }),
    };
  } catch (error) {
    logger.error(JSON.stringify(error));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao publicar evento",
        error: JSON.stringify(error),
      }),
    };
  }
};
