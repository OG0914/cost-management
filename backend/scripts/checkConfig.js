/**
 * 检查系统配置
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/cost_analysis.db');

console.log('查询系统配置...');
console.log('数据库路径:', dbPath);

try {
  const db = new Database(dbPath);
  
  const configs = db.prepare('SELECT * FROM system_config ORDER BY config_key').all();
  
  console.log('\n系统配置列表:');
  console.log('-----------------------------------');
  configs.forEach(config => {
    console.log(`${config.config_key}: ${config.config_value}`);
    if (config.description) {
      console.log(`  描述: ${config.description}`);
    }
    console.log('');
  });
  
  db.close();
  
} catch (error) {
  console.error('查询失败:', error);
  process.exit(1);
}
