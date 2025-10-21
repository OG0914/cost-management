/**
 * 数据库迁移脚本：添加包装配置和工序配置表
 */

const dbManager = require('../db/database');
const path = require('path');
const fs = require('fs');

function runMigration() {
  try {
    // 初始化数据库
    const dbPath = path.join(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);
    const db = dbManager.getDatabase();

    console.log('开始执行迁移...');

    // 读取迁移 SQL
    const migrationPath = path.join(__dirname, '../db/migrations/001_add_packaging_config.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // 执行迁移
    db.exec(migrationSQL);

    console.log('✅ 迁移完成！');
    console.log('已创建表：');
    console.log('  - packaging_configs (包装配置表)');
    console.log('  - process_configs (工序配置表)');

    dbManager.close();
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

runMigration();
