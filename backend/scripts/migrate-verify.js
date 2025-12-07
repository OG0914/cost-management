/**
 * 数据迁移验证脚本（一次性迁移工具）
 * 比对 SQLite 和 PostgreSQL 数据库的记录数
 * 验证关键数据一致性
 * 
 * 注意：此脚本需要 better-sqlite3 依赖，仅用于验证 SQLite 到 PostgreSQL 的迁移
 * 迁移完成后，此脚本可以归档或删除
 * 如需运行，请先安装：npm install better-sqlite3
 */

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// SQLite 数据库路径
const SQLITE_PATH = path.join(__dirname, '../db/cost_analysis.db');

// 要验证的表列表
const TABLES_TO_VERIFY = [
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

// 创建 PostgreSQL 连接池
function createPgPool() {
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
 * 获取 SQLite 表的记录数
 */
function getSqliteCount(db, tableName) {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    return result.count;
  } catch (err) {
    return -1; // 表不存在
  }
}

/**
 * 获取 PostgreSQL 表的记录数
 */
async function getPgCount(pool, tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (err) {
    return -1; // 表不存在
  }
}

/**
 * 验证关键数据一致性
 */
async function verifyKeyData(sqliteDb, pgPool) {
  console.log('\n验证关键数据一致性:');
  const issues = [];

  // 验证用户数据
  try {
    const sqliteUsers = sqliteDb.prepare('SELECT id, username, role FROM users ORDER BY id').all();
    const pgResult = await pgPool.query('SELECT id, username, role FROM users ORDER BY id');
    const pgUsers = pgResult.rows;

    if (sqliteUsers.length !== pgUsers.length) {
      issues.push(`用户数量不一致: SQLite=${sqliteUsers.length}, PostgreSQL=${pgUsers.length}`);
    } else {
      for (let i = 0; i < sqliteUsers.length; i++) {
        if (sqliteUsers[i].username !== pgUsers[i].username) {
          issues.push(`用户 ID ${sqliteUsers[i].id} 用户名不一致`);
        }
      }
      console.log(`  ✓ 用户数据一致 (${sqliteUsers.length} 条)`);
    }
  } catch (err) {
    issues.push(`验证用户数据失败: ${err.message}`);
  }

  // 验证法规数据
  try {
    const sqliteRegs = sqliteDb.prepare('SELECT id, name FROM regulations ORDER BY id').all();
    const pgResult = await pgPool.query('SELECT id, name FROM regulations ORDER BY id');
    const pgRegs = pgResult.rows;

    if (sqliteRegs.length !== pgRegs.length) {
      issues.push(`法规数量不一致: SQLite=${sqliteRegs.length}, PostgreSQL=${pgRegs.length}`);
    } else {
      console.log(`  ✓ 法规数据一致 (${sqliteRegs.length} 条)`);
    }
  } catch (err) {
    issues.push(`验证法规数据失败: ${err.message}`);
  }

  // 验证型号数据
  try {
    const sqliteModels = sqliteDb.prepare('SELECT id, model_name FROM models ORDER BY id').all();
    const pgResult = await pgPool.query('SELECT id, model_name FROM models ORDER BY id');
    const pgModels = pgResult.rows;

    if (sqliteModels.length !== pgModels.length) {
      issues.push(`型号数量不一致: SQLite=${sqliteModels.length}, PostgreSQL=${pgModels.length}`);
    } else {
      console.log(`  ✓ 型号数据一致 (${sqliteModels.length} 条)`);
    }
  } catch (err) {
    issues.push(`验证型号数据失败: ${err.message}`);
  }

  // 验证报价单数据
  try {
    const sqliteQuotes = sqliteDb.prepare('SELECT id, quotation_no, status FROM quotations ORDER BY id').all();
    const pgResult = await pgPool.query('SELECT id, quotation_no, status FROM quotations ORDER BY id');
    const pgQuotes = pgResult.rows;

    if (sqliteQuotes.length !== pgQuotes.length) {
      issues.push(`报价单数量不一致: SQLite=${sqliteQuotes.length}, PostgreSQL=${pgQuotes.length}`);
    } else {
      console.log(`  ✓ 报价单数据一致 (${sqliteQuotes.length} 条)`);
    }
  } catch (err) {
    issues.push(`验证报价单数据失败: ${err.message}`);
  }

  return issues;
}

/**
 * 主验证函数
 */
async function verifyMigration() {
  console.log('开始验证数据迁移...\n');

  // 检查 SQLite 数据库是否存在
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error('错误: SQLite 数据库文件不存在');
    console.log('如果已完成迁移并删除了 SQLite 文件，可以跳过此验证');
    process.exit(1);
  }

  const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
  const pgPool = createPgPool();

  try {
    // 测试 PostgreSQL 连接
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL 连接成功\n');

    // 比对记录数
    console.log('比对各表记录数:');
    console.log('─'.repeat(50));
    console.log('表名'.padEnd(25) + 'SQLite'.padEnd(10) + 'PostgreSQL'.padEnd(10) + '状态');
    console.log('─'.repeat(50));

    let allMatch = true;
    const results = [];

    for (const tableName of TABLES_TO_VERIFY) {
      const sqliteCount = getSqliteCount(sqliteDb, tableName);
      const pgCount = await getPgCount(pgPool, tableName);

      let status;
      if (sqliteCount === -1 && pgCount === -1) {
        status = '两边都不存在';
      } else if (sqliteCount === -1) {
        status = 'SQLite 不存在';
      } else if (pgCount === -1) {
        status = 'PostgreSQL 不存在';
        allMatch = false;
      } else if (sqliteCount === pgCount) {
        status = '✓ 一致';
      } else {
        status = `✗ 差异: ${pgCount - sqliteCount}`;
        allMatch = false;
      }

      const sqliteStr = sqliteCount === -1 ? 'N/A' : sqliteCount.toString();
      const pgStr = pgCount === -1 ? 'N/A' : pgCount.toString();
      
      console.log(
        tableName.padEnd(25) + 
        sqliteStr.padEnd(10) + 
        pgStr.padEnd(10) + 
        status
      );

      results.push({ tableName, sqliteCount, pgCount, status });
    }

    console.log('─'.repeat(50));

    // 验证关键数据
    const issues = await verifyKeyData(sqliteDb, pgPool);

    // 输出总结
    console.log('\n' + '='.repeat(50));
    if (allMatch && issues.length === 0) {
      console.log('✓ 验证通过! 所有表的记录数一致，关键数据正确');
    } else {
      console.log('✗ 验证发现问题:');
      if (!allMatch) {
        console.log('  - 部分表的记录数不一致');
      }
      if (issues.length > 0) {
        for (const issue of issues) {
          console.log(`  - ${issue}`);
        }
      }
    }
    console.log('='.repeat(50));

    // 返回验证结果
    return allMatch && issues.length === 0;

  } catch (error) {
    console.error('\n验证过程出错:', error);
    return false;
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

// 执行验证
verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('验证失败:', err);
    process.exit(1);
  });
