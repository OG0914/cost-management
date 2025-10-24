/**
 * 数据库迁移脚本：为用户表添加 is_active 字段
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);
const db = dbManager.getDatabase();

console.log('开始添加 is_active 字段到用户表...\n');

try {
  // 检查字段是否已存在
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasIsActive = tableInfo.some(col => col.name === 'is_active');

  if (hasIsActive) {
    console.log('✓ is_active 字段已存在，无需添加');
  } else {
    // 添加 is_active 字段，默认值为 1（启用）
    db.prepare('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1').run();
    console.log('✓ 成功添加 is_active 字段');

    // 将所有现有用户设置为启用状态
    const result = db.prepare('UPDATE users SET is_active = 1 WHERE is_active IS NULL').run();
    console.log(`✓ 更新了 ${result.changes} 个现有用户的状态为启用`);
  }

  console.log('\n✅ 数据库迁移完成！');
} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  process.exit(1);
}

// 关闭数据库
dbManager.close();
