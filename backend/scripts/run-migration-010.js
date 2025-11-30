/**
 * 运行数据库迁移：添加散货（LCL）运费配置项
 */

const dbManager = require('../db/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // 初始化数据库
    const dbPath = path.join(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);
    const db = dbManager.getDatabase();

    console.log('开始执行迁移：添加散货（LCL）运费配置项...');

    // 读取迁移SQL文件
    const migrationPath = path.join(__dirname, '../db/migrations/010_add_lcl_freight_config.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 执行迁移
    db.exec(sql);

    console.log('✓ 迁移执行成功！');
    console.log('已添加以下配置项：');
    console.log('  - lcl_base_freight_1_3: 散货基础运费（1-3 CBM）');
    console.log('  - lcl_base_freight_4_10: 散货基础运费（4-10 CBM）');
    console.log('  - lcl_base_freight_11_15: 散货基础运费（11-15 CBM）');
    console.log('  - lcl_handling_charge: 散货操作费');
    console.log('  - lcl_cfs_per_cbm: 散货拼箱费（每CBM）');
    console.log('  - lcl_document_fee: 散货文件费');

    // 验证配置是否插入成功
    const stmt = db.prepare('SELECT config_key, config_value FROM system_config WHERE config_key LIKE ?');
    const configs = stmt.all('lcl_%');
    
    console.log('\n当前散货运费配置：');
    configs.forEach(config => {
      console.log(`  ${config.config_key}: ${config.config_value}`);
    });

    dbManager.close();
    console.log('\n数据库连接已关闭');

  } catch (error) {
    console.error('迁移执行失败:', error);
    process.exit(1);
  }
}

runMigration();
