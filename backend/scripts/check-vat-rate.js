require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const db = require('../db/database');
const SystemConfig = require('../models/SystemConfig');
const CostCalculator = require('../utils/costCalculator');

(async () => {
  await db.initialize();
  
  const calculatorConfig = await SystemConfig.getCalculatorConfig();
  logger.info('calculatorConfig.vatRate:', calculatorConfig.vatRate, typeof calculatorConfig.vatRate);

  const calculator = new CostCalculator(calculatorConfig);
  logger.info('calculator.vatRate:', calculator.vatRate, typeof calculator.vatRate);

  // 测试计算
  const priceBase = 17.2364;
  const vatRate = calculator.vatRate;
  const result = priceBase * (1 + vatRate);
  logger.info('\n计算测试:');
  logger.info('priceBase:', priceBase);
  logger.info('vatRate:', vatRate);
  logger.info('1 + vatRate:', 1 + vatRate);
  logger.info('priceBase * (1 + vatRate):', result);
  
  await db.close();
})();
