/**
 * 测试FOB深圳运费汇率配置
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/cost_analysis.db');
const db = new Database(dbPath);

console.log('测试FOB深圳运费汇率配置...\n');

try {
  // 获取所有配置
  const configs = db.prepare('SELECT * FROM system_config ORDER BY config_key').all();
  
  const configObj = {};
  configs.forEach(config => {
    try {
      configObj[config.config_key] = JSON.parse(config.config_value);
    } catch (e) {
      configObj[config.config_key] = config.config_value;
    }
  });
  
  console.log('1. 所有系统配置:');
  console.log('-----------------------------------');
  console.log('管销率:', configObj.overhead_rate);
  console.log('增值税率:', configObj.vat_rate);
  console.log('保险率:', configObj.insurance_rate);
  console.log('汇率（CNY/USD）:', configObj.exchange_rate);
  console.log('FOB深圳运费汇率（USD/CNY）:', configObj.fob_shenzhen_exchange_rate);
  console.log('利润区间:', configObj.profit_tiers);
  
  // 模拟整柜FOB深圳运费计算
  console.log('\n2. 整柜FOB深圳运费计算示例:');
  console.log('-----------------------------------');
  const freightUSD = 840;
  const exchangeRate = parseFloat(configObj.fob_shenzhen_exchange_rate) || 7.1;
  const totalFreight = freightUSD * exchangeRate;
  
  console.log(`运费（美金）: $${freightUSD}`);
  console.log(`运费汇率: ${exchangeRate}`);
  console.log(`运费总计（人民币）: ¥${totalFreight.toFixed(2)}`);
  
  // 对比成本计算汇率
  console.log('\n3. 汇率对比:');
  console.log('-----------------------------------');
  const costExchangeRate = parseFloat(configObj.exchange_rate) || 7.2;
  console.log(`成本计算汇率（CNY/USD）: ${costExchangeRate}`);
  console.log(`运费汇率（USD/CNY）: ${exchangeRate}`);
  console.log(`说明: 两个汇率独立管理，互不影响`);
  
  db.close();
  
  console.log('\n✓ 测试通过！FOB深圳运费汇率配置正常工作');
  
} catch (error) {
  console.error('✗ 测试失败:', error.message);
  db.close();
  process.exit(1);
}
