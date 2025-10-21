/**
 * 运行数据库迁移脚本
 */

const fs = require('fs');
const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

// 读取并执行迁移脚本
const migrationsDir = path.resolve(__dirname, '../db/migrations');
const migrationFile = path.join(migrationsDir, '001_add_packaging_config.sql');

console.log('开始执行数据库迁移...');
console.log('迁移文件:', migrationFile);

try {
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // 执行SQL语句
  db.exec(sql);
  
  console.log('✅ 迁移执行成功！');
  console.log('已创建表: packaging_configs, process_configs');
  
} catch (error) {
  console.error('❌ 迁移执行失败:', error.message);
  process.exit(1);
}

dbManager.close();
console.log('数据库连接已关闭');
