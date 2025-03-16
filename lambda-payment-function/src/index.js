import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import log from "lambda-log"; // Use ES module import
const eventBridgeClient = new EventBridgeClient();


export const lambda_handler = async (event, context) => {
  try {
    log.info(JSON.stringify(event));
    log.info("publicando evento")
    const result = await eventBridgeClient.send(new PutEventsCommand({
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
    }));
    log.info(`Evento publicado com sucesso ${result}`)
  } catch (error) {
    log.error(error);
    throw error;

  }

};
