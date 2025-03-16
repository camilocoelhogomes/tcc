import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import log from "lambda-log"; // Use ES module import
const eventBridgeClient = new EventBridgeClient();


export const lambda_handler = async (event, context) => {
  try {
    log.info(JSON.stringify(event));
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
    log.info(`Evento publicado com sucesso ${JSON.stringify(result)}`)
  } catch (error) {
    log.error(error);
    throw error;

  }

};
