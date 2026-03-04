/**
 * 包装类型迁移脚本
 * 执行 003_add_packaging_type.sql 迁移
 */

const path = require('path');
// 从 backend 目录加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const logger = require('../utils/logger');
const dbManager = require('../db/database');

async function runMigration() {
  // 初始化数据库连接
  await dbManager.initialize();
  logger.info('='.repeat(60));
  logger.info('开始执行包装类型迁移...');
  logger.info('='.repeat(60));

  try {
    // 检查迁移是否已执行
    const checkResult = await dbManager.query(
      "SELECT 1 FROM migrations WHERE name = '003_add_packaging_type'"
    );

    if (checkResult.rows.length > 0) {
      logger.info('⚠️  迁移 003_add_packaging_type 已执行过，跳过');
      return;
    }

    // 读取迁移 SQL 文件
    const sqlPath = path.join(__dirname, '../db/migrations/003_add_packaging_type.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行迁移
    logger.info('\n📦 执行迁移脚本...');
    await dbManager.query(sql);
    logger.info('✅ 迁移脚本执行成功');

    // 验证迁移结果
    logger.info('\n🔍 验证迁移结果...');

    // 检查新字段是否存在
    const columnsResult = await dbManager.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'packaging_configs'
      AND column_name IN ('packaging_type', 'layer1_qty', 'layer2_qty', 'layer3_qty')
      ORDER BY column_name
    `);

    logger.info('\n新增字段:');
    columnsResult.rows.forEach(col => {
      logger.info(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 检查约束是否存在
    const constraintResult = await dbManager.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'chk_packaging_type'
    `);
    logger.info(`\n约束 chk_packaging_type: ${constraintResult.rows.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 检查索引是否存在
    const indexResult = await dbManager.query(`
      SELECT indexname FROM pg_indexes WHERE indexname = 'idx_packaging_configs_type'
    `);
    logger.info(`索引 idx_packaging_configs_type: ${indexResult.rows.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 检查数据迁移结果
    const dataResult = await dbManager.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN packaging_type = 'standard_box' THEN 1 END) as standard_box_count,
             COUNT(CASE WHEN layer1_qty IS NOT NULL THEN 1 END) as layer1_count,
             COUNT(CASE WHEN layer2_qty IS NOT NULL THEN 1 END) as layer2_count,
             COUNT(CASE WHEN layer3_qty IS NOT NULL THEN 1 END) as layer3_count
      FROM packaging_configs
    `);
    
    const data = dataResult.rows[0];
    logger.info(`\n数据迁移结果:`);
    logger.info(`  - 总配置数: ${data.total}`);
    logger.info(`  - standard_box 类型: ${data.standard_box_count}`);
    logger.info(`  - layer1_qty 已填充: ${data.layer1_count}`);
    logger.info(`  - layer2_qty 已填充: ${data.layer2_count}`);
    logger.info(`  - layer3_qty 已填充: ${data.layer3_count}`);

    // 显示示例数据
    const sampleResult = await dbManager.query(`
      SELECT id, config_name, packaging_type, layer1_qty, layer2_qty, layer3_qty
      FROM packaging_configs
      LIMIT 5
    `);

    if (sampleResult.rows.length > 0) {
      logger.info('\n示例数据:');
      sampleResult.rows.forEach(row => {
        logger.info(`  ID ${row.id}: ${row.config_name} - ${row.packaging_type} (${row.layer1_qty}/${row.layer2_qty}/${row.layer3_qty})`);
      });
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ 包装类型迁移完成！');
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('\n❌ 迁移失败:', error.message);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

// 执行迁移
runMigration();
