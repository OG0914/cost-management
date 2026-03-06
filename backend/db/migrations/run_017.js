/**
 * 执行迁移脚本 017：添加物料价格变更提醒系统
 */
const dbManager = require('../database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('正在连接数据库...');
    await dbManager.initialize();
    console.log('数据库连接成功');

    const sqlFile = path.join(__dirname, '017_add_price_change_notifications.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 分割 SQL 语句（按分号分隔，但忽略注释中的分号）
    const statements = sql
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
      .replace(/--.*$/gm, '') // 移除行注释
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`准备执行 ${statements.length} 条 SQL 语句...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        await dbManager.query(statement);
        console.log(`✓ 执行成功 (${i + 1}/${statements.length})`);
      } catch (err) {
        // 忽略 "已存在" 的错误
        if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
          console.log(`⊘ 已存在，跳过 (${i + 1}/${statements.length})`);
        } else {
          console.error(`✗ 执行失败 (${i + 1}/${statements.length}):`, err.message);
        }
      }
    }

    console.log('\n========================================');
    console.log('迁移完成：物料价格变更提醒系统表结构已创建');
    console.log('========================================');

  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  } finally {
    await dbManager.close();
    process.exit(0);
  }
}

runMigration();
