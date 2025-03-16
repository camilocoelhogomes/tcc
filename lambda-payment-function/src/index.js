import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import log from "lambda-log"; // Use ES module import
const eventBridgeClient = new EventBridgeClient();


export const lambda_handler = async (event, context) => {
  try {
    log.info(JSON.stringify({ event, context }));
    const putEventsComand = {
      Entries: [
        {
          EventBusName: 'tcc-event-bus',
          Source: context.function_name,
          DetailType: 'payment',
          Detail: JSON.stringify({
            amount: 100,
            paymentType: 'credit_card',
          }),
        },
      ],
    }
    log.info(`Publicando evento ${JSON.stringify(putEventsComand)}`);
    const result = await eventBridgeClient.send(new PutEventsCommand(putEventsComand));
    if (result.FailedEntryCount > 0) {
      log.error(`Erro ao publicar evento ${JSON.stringify(result)}`);
      throw result.Entries.filter(entry => entry.ErrorCode);
    }
    log.info(`Evento publicado com sucesso ${JSON.stringify(result)}`)
  } catch (error) {
    log.error(error);
    throw error;

  }

};
