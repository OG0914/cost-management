/**
 * PostgreSQL 数据导入脚本
 * 将导出的 JSON 数据导入到 PostgreSQL 数据库
 * 处理外键依赖顺序和序列值重置
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 导入文件路径
const IMPORT_PATH = path.join(__dirname, '../db/migrations/export-data.json');

// 表的导入顺序（被依赖的表在前）
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

// 布尔字段映射（SQLite 使用 0/1，PostgreSQL 使用 true/false）
const BOOLEAN_FIELDS = {
  users: ['is_active'],
  regulations: ['is_active'],
  models: ['is_active'],
  packaging_configs: ['is_active'],
  process_configs: ['is_active'],
  packaging_materials: ['is_active'],
  quotations: ['include_freight_in_base'],
  quotation_items: ['is_changed', 'after_overhead'],
  standard_costs: ['is_current']
};

// 创建连接池
function createPool() {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return new Pool({ connectionString });
  }
  
  return new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'cost_analysis',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres'
  });
}

/**
 * 转换布尔值（SQLite 0/1 -> PostgreSQL true/false）
 */
function convertBooleans(tableName, row) {
  const boolFields = BOOLEAN_FIELDS[tableName] || [];
  const converted = { ...row };
  
  for (const field of boolFields) {
    if (field in converted) {
      converted[field] = converted[field] === 1 || converted[field] === true;
    }
  }
  
  return converted;
}

/**
 * 生成 INSERT 语句
 */
function generateInsertSQL(tableName, columns) {
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
}

/**
 * 重置序列值
 */
async function resetSequence(client, tableName) {
  try {
    // 获取表的最大 ID
    const result = await client.query(`SELECT MAX(id) as max_id FROM ${tableName}`);
    const maxId = result.rows[0].max_id || 0;
    
    if (maxId > 0) {
      // 重置序列到最大 ID + 1
      const sequenceName = `${tableName}_id_seq`;
      await client.query(`SELECT setval('${sequenceName}', $1, true)`, [maxId]);
      console.log(`  重置序列 ${sequenceName} 到 ${maxId}`);
    }
  } catch (err) {
    // 某些表可能没有序列，忽略错误
    if (!err.message.includes('does not exist')) {
      console.warn(`  警告: 重置序列失败 - ${err.message}`);
    }
  }
}

/**
 * 导入单张表的数据
 */
async function importTable(client, tableName, tableData) {
  const { count, data } = tableData;
  
  if (!data || data.length === 0) {
    console.log(`  ${tableName}: 无数据，跳过`);
    return 0;
  }

  // 获取列名（从第一条记录）
  const columns = Object.keys(data[0]);
  const insertSQL = generateInsertSQL(tableName, columns);
  
  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    try {
      // 转换布尔值
      const convertedRow = convertBooleans(tableName, row);
      const values = columns.map(col => convertedRow[col]);
      
      const result = await client.query(insertSQL, values);
      if (result.rowCount > 0) {
        imported++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  导入记录失败 (${tableName}):`, err.message);
      skipped++;
    }
  }

  console.log(`  ${tableName}: 导入 ${imported} 条，跳过 ${skipped} 条（共 ${count} 条）`);
  return imported;
}

/**
 * 清空表数据（按反向依赖顺序）
 */
async function truncateTables(client) {
  // 反向顺序删除数据
  const reverseOrder = [...TABLE_ORDER].reverse();
  
  console.log('清空现有数据...');
  for (const tableName of reverseOrder) {
    try {
      await client.query(`DELETE FROM ${tableName}`);
      console.log(`  清空表 ${tableName}`);
    } catch (err) {
      // 表可能不存在，忽略
    }
  }
}

/**
 * 主导入函数
 */
async function importData() {
  console.log('开始导入数据到 PostgreSQL...');
  
  // 检查导入文件是否存在
  if (!fs.existsSync(IMPORT_PATH)) {
    console.error(`错误: 导入文件不存在: ${IMPORT_PATH}`);
    console.error('请先运行 migrate-export.js 导出数据');
    process.exit(1);
  }

  // 读取导出数据
  const exportData = JSON.parse(fs.readFileSync(IMPORT_PATH, 'utf8'));
  console.log(`导出时间: ${exportData.exportedAt}`);
  console.log(`包含 ${Object.keys(exportData.tables).length} 张表\n`);

  const pool = createPool();
  const client = await pool.connect();

  try {
    // 开始事务
    await client.query('BEGIN');
    
    // 临时禁用触发器和外键约束
    await client.query('SET session_replication_role = replica');
    
    // 清空现有数据
    await truncateTables(client);
    
    let totalImported = 0;

    // 按依赖顺序导入表
    console.log('按依赖顺序导入表:');
    for (const tableName of TABLE_ORDER) {
      if (exportData.tables[tableName]) {
        const imported = await importTable(client, tableName, exportData.tables[tableName]);
        totalImported += imported;
      }
    }

    // 导入未在 TABLE_ORDER 中的表
    const extraTables = Object.keys(exportData.tables).filter(t => !TABLE_ORDER.includes(t));
    if (extraTables.length > 0) {
      console.log('\n导入额外的表:');
      for (const tableName of extraTables) {
        // 跳过迁移记录表
        if (tableName === 'migrations') continue;
        
        const imported = await importTable(client, tableName, exportData.tables[tableName]);
        totalImported += imported;
      }
    }

    // 重置所有序列
    console.log('\n重置序列值:');
    for (const tableName of [...TABLE_ORDER, ...extraTables]) {
      if (exportData.tables[tableName] && tableName !== 'migrations') {
        await resetSequence(client, tableName);
      }
    }

    // 恢复外键约束检查
    await client.query('SET session_replication_role = DEFAULT');
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log(`\n导入完成! 总计导入 ${totalImported} 条记录`);

  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('\n导入失败，已回滚:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行导入
importData().catch(err => {
  console.error('导入过程出错:', err);
  process.exit(1);
});
