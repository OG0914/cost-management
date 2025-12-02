/**
 * 数据库迁移脚本：将原料表的 model_id 字段改为 manufacturer（厂商）
 * 
 * 变更说明：
 * - 将 materials 表的 model_id 字段重命名为 manufacturer
 * - 将字段类型从 INTEGER 改为 TEXT
 * - 移除外键约束
 * - 保留原有数据（将 model_id 转换为对应的型号名称作为厂商名）
 */

const dbManager = require('../db/database');
const path = require('path');

async function migrate() {
  console.log('开始迁移：将原料表的 model_id 改为 manufacturer...');
  
  const db = dbManager.getDatabase();
  
  try {
    // 禁用外键约束
    db.pragma('foreign_keys = OFF');
    
    // 开始事务
    db.exec('BEGIN TRANSACTION');
    
    // 1. 创建新的临时表
    console.log('步骤 1: 创建新的 materials 表结构...');
    db.exec(`
      CREATE TABLE materials_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_no TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'CNY',
        manufacturer TEXT,
        usage_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 迁移数据（将 model_id 转换为对应的型号名称）
    console.log('步骤 2: 迁移数据...');
    db.exec(`
      INSERT INTO materials_new (id, item_no, name, unit, price, currency, manufacturer, usage_amount, created_at, updated_at)
      SELECT 
        m.id,
        m.item_no,
        m.name,
        m.unit,
        m.price,
        m.currency,
        CASE 
          WHEN m.model_id IS NOT NULL THEN mo.model_name
          ELSE NULL
        END as manufacturer,
        m.usage_amount,
        m.created_at,
        m.updated_at
      FROM materials m
      LEFT JOIN models mo ON m.model_id = mo.id
    `);
    
    // 3. 删除旧表
    console.log('步骤 3: 删除旧表...');
    db.exec('DROP TABLE materials');
    
    // 4. 重命名新表
    console.log('步骤 4: 重命名新表...');
    db.exec('ALTER TABLE materials_new RENAME TO materials');
    
    // 5. 重建索引
    console.log('步骤 5: 重建索引...');
    db.exec('CREATE INDEX IF NOT EXISTS idx_materials_item_no ON materials(item_no)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_materials_manufacturer ON materials(manufacturer)');
    
    // 提交事务
    db.exec('COMMIT');
    
    // 重新启用外键约束
    db.pragma('foreign_keys = ON');
    
    console.log('✓ 迁移成功完成！');
    console.log('');
    console.log('变更摘要：');
    console.log('- 字段 model_id (INTEGER) 已改为 manufacturer (TEXT)');
    console.log('- 已移除外键约束');
    console.log('- 原有的型号绑定已转换为厂商名称');
    console.log('');
    
    // 显示迁移后的数据统计
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(manufacturer) as with_manufacturer
      FROM materials
    `).get();
    
    console.log(`数据统计：`);
    console.log(`- 总记录数: ${stats.total}`);
    console.log(`- 有厂商信息: ${stats.with_manufacturer}`);
    console.log(`- 无厂商信息: ${stats.total - stats.with_manufacturer}`);
    
  } catch (error) {
    // 回滚事务
    try {
      db.exec('ROLLBACK');
      db.pragma('foreign_keys = ON');
    } catch (rollbackError) {
      console.error('回滚失败:', rollbackError);
    }
    
    console.error('✗ 迁移失败:', error.message);
    throw error;
  }
}

// 执行迁移
if (require.main === module) {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../db/cost_analysis.db');
  
  // 直接连接数据库，不执行初始化脚本
  const db = new Database(dbPath);
  dbManager.db = db;
  
  migrate()
    .then(() => {
      console.log('\n迁移脚本执行完成');
      db.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n迁移脚本执行失败:', error);
      db.close();
      process.exit(1);
    });
}

module.exports = { migrate };
