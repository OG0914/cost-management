/**
 * 测试工序API
 */

const PackagingConfig = require('../models/PackagingConfig');
const ProcessConfig = require('../models/ProcessConfig');
const dbManager = require('../db/database');
const path = require('path');

// 初始化数据库
const dbPath = path.join(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);

console.log('=== 测试工序API ===\n');

// 测试获取所有包装配置
console.log('1. 获取所有包装配置:');
const configs = PackagingConfig.findAll();
console.log(`   找到 ${configs.length} 个配置\n`);

// 为每个配置计算工序总价
const configsWithPrice = configs.map(config => {
  const processes = ProcessConfig.findByPackagingConfigId(config.id);
  const processSum = processes.reduce((sum, p) => sum + p.unit_price, 0);
  const totalPrice = processSum * 1.56;
  
  console.log(`   配置 ID: ${config.id}`);
  console.log(`   型号: ${config.model_name}`);
  console.log(`   配置名称: ${config.config_name}`);
  console.log(`   工序数量: ${processes.length}`);
  console.log(`   工序小计: ${processSum.toFixed(4)}`);
  console.log(`   工序总价: ${totalPrice.toFixed(4)}`);
  console.log('');
  
  return {
    ...config,
    process_total_price: totalPrice
  };
});

console.log('2. 模拟API返回数据:');
console.log(JSON.stringify({
  success: true,
  data: configsWithPrice
}, null, 2));

dbManager.close();
