import log from "lambda-log"; // Use ES module import

export const lambda_handler = async (event) => {
  log.info(JSON.stringify(event));
  return {
    statusCode: 200,
    body: "Camilo Coelho Gomes",
  };
};
