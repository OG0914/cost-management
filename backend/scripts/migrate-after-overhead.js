/**
 * 数据库迁移脚本：添加 after_overhead 字段
 * 运行方式：node backend/scripts/migrate-after-overhead.js
 */

const path = require('path');
const dbManager = require('../db/database');

function migrateDatabase() {
  // 初始化数据库连接
  const dbPath = path.join(__dirname, '../db/cost_analysis.db');
  dbManager.initialize(dbPath);
  
  const db = dbManager.getDatabase();
  
  try {
    console.log('开始数据库迁移：添加 after_overhead 字段...');
    
    // 检查字段是否已存在
    const tableInfo = db.prepare("PRAGMA table_info(quotation_items)").all();
    const hasAfterOverhead = tableInfo.some(col => col.name === 'after_overhead');
    
    if (hasAfterOverhead) {
      console.log('字段 after_overhead 已存在，跳过迁移');
      return;
    }
    
    // 添加字段
    db.prepare('ALTER TABLE quotation_items ADD COLUMN after_overhead BOOLEAN DEFAULT 0').run();
    
    console.log('✓ 成功添加 after_overhead 字段');
    console.log('迁移完成！');
    
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

// 执行迁移
migrateDatabase();
