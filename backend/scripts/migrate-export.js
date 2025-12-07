/**
 * SQLite 数据导出脚本（一次性迁移工具）
 * 将 SQLite 数据库中的所有表数据导出为 JSON 文件
 * 按依赖顺序排列表，确保导入时外键约束正确
 * 
 * 注意：此脚本需要 better-sqlite3 依赖，仅用于从 SQLite 迁移到 PostgreSQL
 * 迁移完成后，此脚本可以归档或删除
 * 如需运行，请先安装：npm install better-sqlite3
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// SQLite 数据库路径
const DB_PATH = path.join(__dirname, '../db/cost_analysis.db');
// 导出文件路径
const EXPORT_PATH = path.join(__dirname, '../db/migrations/export-data.json');

// 表的依赖顺序（被依赖的表在前）
const TABLE_ORDER = [
  'users',
  'regulations',
  'models',
  'materials',
  'processes',
  'packaging',
  'packaging_configs',
  'process_configs',
  'packaging_materials',
  'quotations',
  'quotation_items',
  'quotation_custom_fees',
  'comments',
  'system_config',
  'price_history',
  'standard_costs'
];

function exportData() {
  console.log('开始导出 SQLite 数据...');
  console.log(`数据库路径: ${DB_PATH}`);
  
  // 检查数据库文件是否存在
  if (!fs.existsSync(DB_PATH)) {
    console.error('错误: SQLite 数据库文件不存在');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const exportData = {
    exportedAt: new Date().toISOString(),
    tables: {}
  };

  try {
    // 获取数据库中实际存在的表
    const existingTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all().map(t => t.name);

    console.log(`发现 ${existingTables.length} 张表: ${existingTables.join(', ')}`);

    // 按依赖顺序导出表
    for (const tableName of TABLE_ORDER) {
      if (!existingTables.includes(tableName)) {
        console.log(`跳过不存在的表: ${tableName}`);
        continue;
      }

      try {
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
        exportData.tables[tableName] = {
          count: rows.length,
          data: rows
        };
        console.log(`导出表 ${tableName}: ${rows.length} 条记录`);
      } catch (err) {
        console.error(`导出表 ${tableName} 失败:`, err.message);
      }
    }

    // 检查是否有未在 TABLE_ORDER 中的表
    const unexportedTables = existingTables.filter(t => !TABLE_ORDER.includes(t));
    if (unexportedTables.length > 0) {
      console.log(`\n警告: 以下表未在导出顺序中定义: ${unexportedTables.join(', ')}`);
      for (const tableName of unexportedTables) {
        try {
          const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
          exportData.tables[tableName] = {
            count: rows.length,
            data: rows
          };
          console.log(`额外导出表 ${tableName}: ${rows.length} 条记录`);
        } catch (err) {
          console.error(`导出表 ${tableName} 失败:`, err.message);
        }
      }
    }

    // 确保导出目录存在
    const exportDir = path.dirname(EXPORT_PATH);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 写入 JSON 文件
    fs.writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2), 'utf8');
    
    console.log(`\n导出完成!`);
    console.log(`导出文件: ${EXPORT_PATH}`);
    console.log(`总计导出 ${Object.keys(exportData.tables).length} 张表`);
    
    // 打印统计信息
    console.log('\n数据统计:');
    let totalRecords = 0;
    for (const [table, info] of Object.entries(exportData.tables)) {
      console.log(`  ${table}: ${info.count} 条`);
      totalRecords += info.count;
    }
    console.log(`  总计: ${totalRecords} 条记录`);

  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行导出
exportData();
