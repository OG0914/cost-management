/**
 * 数据库迁移脚本：将 models 表的 remark 字段重命名为 model_category
 * 用于区分口罩、半面罩等类型
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');

try {
  console.log('========================================');
  console.log('开始迁移：models.remark -> models.model_category');
  console.log('数据库路径:', dbPath);
  console.log('========================================\n');
  
  if (!fs.existsSync(dbPath)) {
    console.error('✗ 数据库文件不存在:', dbPath);
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  
  // 检查 models 表是否存在
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='models'
  `).get();
  
  if (!tableExists) {
    console.log('✗ models 表不存在');
    db.close();
    process.exit(1);
  }
  
  // 检查是否已经有 model_category 字段
  const columns = db.prepare(`PRAGMA table_info(models)`).all();
  const columnNames = columns.map(col => col.name);
  
  if (columnNames.includes('model_category')) {
    console.log('✓ model_category 字段已存在，无需迁移');
    db.close();
    process.exit(0);
  }
  
  if (!columnNames.includes('remark')) {
    console.log('✗ remark 字段不存在，无法迁移');
    db.close();
    process.exit(1);
  }
  
  console.log('开始执行迁移...\n');
  console.log('注意：SQLite 不支持直接重命名列，将采用添加新列的方式\n');
  
  // 使用事务确保数据一致性
  const migrate = db.transaction(() => {
    // 1. 添加新字段 model_category
    console.log('1. 添加新字段 model_category...');
    db.exec('ALTER TABLE models ADD COLUMN model_category TEXT');
    
    // 2. 复制 remark 的数据到 model_category
    console.log('2. 复制 remark 数据到 model_category...');
    const updateResult = db.prepare(`
      UPDATE models SET model_category = remark
    `).run();
    console.log(`   更新了 ${updateResult.changes} 条记录`);
    
    // 注意：SQLite 不支持 DROP COLUMN，所以 remark 字段会保留
    // 但在应用代码中我们将只使用 model_category
    console.log('\n注意：由于 SQLite 限制，remark 字段将保留但不再使用');
    console.log('应用代码将只使用新的 model_category 字段');
  });
  
  // 执行迁移
  migrate();
  
  // 验证迁移结果
  console.log('\n验证迁移结果...');
  const newColumns = db.prepare(`PRAGMA table_info(models)`).all();
  const newColumnNames = newColumns.map(col => col.name);
  
  if (newColumnNames.includes('model_category')) {
    console.log('✓ 迁移成功！已添加 model_category 字段');
    
    // 显示表结构
    console.log('\n当前表结构:');
    newColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // 显示数据统计
    const count = db.prepare('SELECT COUNT(*) as count FROM models').get();
    console.log(`\n数据统计: 共 ${count.count} 条型号记录`);
    
    // 显示示例数据
    const sample = db.prepare('SELECT model_name, remark, model_category FROM models LIMIT 3').all();
    if (sample.length > 0) {
      console.log('\n示例数据（前3条）:');
      sample.forEach(row => {
        console.log(`  - ${row.model_name}: remark="${row.remark}" -> model_category="${row.model_category}"`);
      });
    }
  } else {
    console.log('✗ 迁移验证失败：model_category 字段未创建');
    db.close();
    process.exit(1);
  }
  
  db.close();
  
  console.log('\n========================================');
  console.log('✓ 迁移完成！');
  console.log('========================================');
  
} catch (error) {
  console.error('\n✗ 迁移失败:', error);
  process.exit(1);
}
