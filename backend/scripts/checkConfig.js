/**
 * 检查系统配置脚本
 * 用于验证所有必要的配置项是否存在
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.join(__dirname, '..', 'db', 'cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

console.log('开始检查系统配置...\n');

// 必需的配置项
const requiredConfigs = [
  { key: 'overhead_rate', description: '管销率', expectedType: 'number' },
  { key: 'vat_rate', description: '增值税率', expectedType: 'number' },
  { key: 'insurance_rate', description: '保险率', expectedType: 'number' },
  { key: 'exchange_rate', description: '汇率（CNY/USD）', expectedType: 'number' },
  { key: 'process_coefficient', description: '工价系数', expectedType: 'number' },
  { key: 'profit_tiers', description: '利润区间', expectedType: 'array' }
];

let allPassed = true;

try {
  const stmt = db.prepare('SELECT * FROM system_config WHERE config_key = ?');
  
  requiredConfigs.forEach(config => {
    const result = stmt.get(config.key);
    
    if (!result) {
      console.log(`❌ 缺少配置: ${config.key} (${config.description})`);
      allPassed = false;
    } else {
      let value = result.config_value;
      let parsedValue;
      
      // 尝试解析值
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
      
      // 验证类型
      const actualType = Array.isArray(parsedValue) ? 'array' : typeof parsedValue;
      
      if (actualType !== config.expectedType) {
        console.log(`⚠️  配置类型不匹配: ${config.key}`);
        console.log(`   期望类型: ${config.expectedType}, 实际类型: ${actualType}`);
        console.log(`   当前值: ${value}`);
      } else {
        console.log(`✓ ${config.key}: ${value} (${config.description})`);
      }
    }
  });
  
  console.log('\n检查完成！');
  
  if (allPassed) {
    console.log('✓ 所有必需的配置项都已存在');
  } else {
    console.log('❌ 存在缺失的配置项，请运行相应的迁移脚本');
  }
  
} catch (error) {
  console.error('检查失败:', error);
  process.exit(1);
} finally {
  dbManager.close();
}
