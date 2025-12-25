require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db/database');
const SystemConfig = require('../models/SystemConfig');
const CostCalculator = require('../utils/costCalculator');

(async () => {
  await db.initialize();
  
  const calculatorConfig = await SystemConfig.getCalculatorConfig();
  console.log('calculatorConfig.vatRate:', calculatorConfig.vatRate, typeof calculatorConfig.vatRate);
  
  const calculator = new CostCalculator(calculatorConfig);
  console.log('calculator.vatRate:', calculator.vatRate, typeof calculator.vatRate);
  
  // 测试计算
  const priceBase = 17.2364;
  const vatRate = calculator.vatRate;
  const result = priceBase * (1 + vatRate);
  console.log('\n计算测试:');
  console.log('priceBase:', priceBase);
  console.log('vatRate:', vatRate);
  console.log('1 + vatRate:', 1 + vatRate);
  console.log('priceBase * (1 + vatRate):', result);
  
  await db.close();
})();
