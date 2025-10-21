/**
 * 数据库迁移脚本：为原料表添加品号字段（修复版）
 * 运行: node scripts/migrateAddItemNoFixed.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

async function migrate() {
  let db;
  try {
    console.log('========================================');
    console.log('开始数据库迁移：添加品号字段');
    console.log('========================================\n');

    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    
    // 备份数据库
    const backupPath = path.resolve(__dirname, `../db/cost_analysis_backup_${Date.now()}.db`);
    console.log('1. 备份数据库...');
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ 数据库已备份到: ${backupPath}\n`);

    // 直接打开数据库，不通过 dbManager
    console.log('2. 连接数据库...');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('✅ 数据库连接成功\n');

    // 检查是否已经有 item_no 字段
    console.log('3. 检查表结构...');
    const tableInfo = db.prepare("PRAGMA table_info(materials)").all();
    const hasItemNo = tableInfo.some(col => col.name === 'item_no');

    if (hasItemNo) {
      console.log('✅ 品号字段已存在，无需迁移\n');
      db.close();
      return;
    }

    console.log('4. 开始迁移...\n');

    // 执行迁移步骤
    console.log('   步骤 1: 创建新表结构...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS materials_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_no TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'CNY',
        model_id INTEGER,
        usage_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES models(id)
      )
    `);
    console.log('   ✅ 新表创建成功');

    console.log('   步骤 2: 复制旧数据并生成品号...');
    db.exec(`
      INSERT INTO materials_new (id, item_no, name, unit, price, currency, model_id, usage_amount, created_at, updated_at)
      SELECT 
        id, 
        'MAT' || printf('%05d', id) as item_no,
        name, 
        unit, 
        price, 
        currency, 
        model_id, 
        usage_amount, 
        created_at, 
        updated_at
      FROM materials
    `);
    
    const copiedCount = db.prepare("SELECT COUNT(*) as count FROM materials_new").get();
    console.log(`   ✅ 已复制 ${copiedCount.count} 条记录`);

    console.log('   步骤 3: 删除旧表...');
    db.exec('DROP TABLE materials');
    console.log('   ✅ 旧表已删除');

    console.log('   步骤 4: 重命名新表...');
    db.exec('ALTER TABLE materials_new RENAME TO materials');
    console.log('   ✅ 新表已重命名');

    console.log('   步骤 5: 创建索引...');
    db.exec('CREATE INDEX IF NOT EXISTS idx_materials_item_no ON materials(item_no)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_materials_model_id ON materials(model_id)');
    console.log('   ✅ 索引创建成功');

    console.log('\n5. 验证迁移结果...');
    
    // 检查新表结构
    const newTableInfo = db.prepare("PRAGMA table_info(materials)").all();
    const newHasItemNo = newTableInfo.some(col => col.name === 'item_no');
    
    if (!newHasItemNo) {
      throw new Error('迁移失败：品号字段未创建');
    }

    // 检查数据
    const count = db.prepare("SELECT COUNT(*) as count FROM materials").get();
    console.log(`✅ 数据完整性检查通过，共 ${count.count} 条记录\n`);

    // 显示示例数据
    const samples = db.prepare("SELECT item_no, name FROM materials LIMIT 5").all();
    if (samples.length > 0) {
      console.log('示例数据：');
      samples.forEach(s => {
        console.log(`  - ${s.item_no}: ${s.name}`);
      });
      console.log('');
    }

    console.log('========================================');
    console.log('✅ 迁移成功完成！');
    console.log('========================================');
    console.log('\n注意事项：');
    console.log('1. 旧数据已自动生成品号（格式：MAT00001, MAT00002...）');
    console.log('2. 新增原料时必须填写品号');
    console.log('3. 品号必须唯一');
    console.log(`4. 数据库备份位置: ${backupPath}`);
    console.log('5. 现在可以重启后端服务了');
    console.log('');

    db.close();

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error);
    console.log('\n请检查备份文件并手动恢复数据库');
    if (db) {
      db.close();
    }
    process.exit(1);
  }
}

migrate();
