-- Query que busca os logs que possuem o mesmo correlationId e functionName
SELECT 
  `correlationId`, 
  `functionName`, 
  COUNT(*) AS `occurrences`
FROM 
  `logGroups(logGroupIdentifier:['/aws/lambda/lambda-benefits-function', '/aws/lambda/lambda-overdue-function', '/aws/lambda/lambda-payment-function'])`
WHERE 
  `correlationId` IS NOT NULL AND `correlationId` != '' AND
  `functionName` IS NOT NULL AND `functionName` != ''
GROUP BY 
  `correlationId`, 
  `functionName`
HAVING 
  `occurrences` > 1
;

-- query que busca o total de correlationIds
SELECT 
  COUNT(DISTINCT `correlationId`) AS `unique_correlation_ids`
FROM 
  `logGroups(logGroupIdentifier:['/aws/lambda/lambda-benefits-function', '/aws/lambda/lambda-overdue-function', '/aws/lambda/lambda-payment-function'])`
WHERE 
  `correlationId` IS NOT NULL AND `correlationId` != '';