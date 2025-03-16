import log from "lambda-log"; // Use ES module import


export const lambda_handler = async (event, context) => {
  try {
    log.info(JSON.stringify({ event, context }));
  } catch (error) {
    log.error(error);
    throw error;

  }

};
