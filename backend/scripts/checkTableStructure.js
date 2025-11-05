/**
 * 检查数据库表结构
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/cost_analysis.db');

console.log('检查数据库表结构...');
console.log('数据库路径:', dbPath);

try {
  const db = new Database(dbPath);
  
  // 查询 quotations 表结构
  const tableInfo = db.prepare('PRAGMA table_info(quotations)').all();
  
  console.log('\nquotations 表结构:');
  console.log('-----------------------------------');
  tableInfo.forEach(col => {
    console.log(`${col.name.padEnd(30)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // 检查是否有 packaging_config_id 列
  const hasPackagingConfigId = tableInfo.some(col => col.name === 'packaging_config_id');
  console.log('\n是否有 packaging_config_id 列:', hasPackagingConfigId ? '是' : '否');
  
  db.close();
  
} catch (error) {
  console.error('检查失败:', error);
  process.exit(1);
}
