/**
 * 数据库迁移脚本：为原料表添加品号字段
 * 运行: node scripts/migrateAddItemNo.js
 */

require('dotenv').config();
const path = require('path');
const dbManager = require('../db/database');
const fs = require('fs');

async function migrate() {
  try {
    console.log('========================================');
    console.log('开始数据库迁移：添加品号字段');
    console.log('========================================\n');

    // 初始化数据库
    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    
    // 备份数据库
    const backupPath = path.resolve(__dirname, `../db/cost_analysis_backup_${Date.now()}.db`);
    console.log('1. 备份数据库...');
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ 数据库已备份到: ${backupPath}\n`);

    dbManager.initialize(dbPath);
    const db = dbManager.getDatabase();

    // 检查是否已经有 item_no 字段
    console.log('2. 检查表结构...');
    const tableInfo = db.prepare("PRAGMA table_info(materials)").all();
    const hasItemNo = tableInfo.some(col => col.name === 'item_no');

    if (hasItemNo) {
      console.log('✅ 品号字段已存在，无需迁移\n');
      dbManager.close();
      return;
    }

    console.log('3. 开始迁移...');

    // 读取迁移 SQL
    const migrationSQL = fs.readFileSync(
      path.resolve(__dirname, '../db/migrations/add_item_no_to_materials.sql'),
      'utf8'
    );

    // 执行迁移（分步执行）
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        console.log(`执行: ${statement.substring(0, 50)}...`);
        db.exec(statement);
      }
    }

    console.log('\n4. 验证迁移结果...');
    
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
    const samples = db.prepare("SELECT item_no, name FROM materials LIMIT 3").all();
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
    console.log('');

    dbManager.close();

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error);
    console.log('\n请检查备份文件并手动恢复数据库');
    process.exit(1);
  }
}

migrate();
