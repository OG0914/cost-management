/**
 * 包装类型迁移脚本
 * 执行 003_add_packaging_type.sql 迁移
 */

const path = require('path');
// 从 backend 目录加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const dbManager = require('../db/database');

async function runMigration() {
  // 初始化数据库连接
  await dbManager.initialize();
  console.log('='.repeat(60));
  console.log('开始执行包装类型迁移...');
  console.log('='.repeat(60));

  try {
    // 检查迁移是否已执行
    const checkResult = await dbManager.query(
      "SELECT 1 FROM migrations WHERE name = '003_add_packaging_type'"
    );
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  迁移 003_add_packaging_type 已执行过，跳过');
      return;
    }

    // 读取迁移 SQL 文件
    const sqlPath = path.join(__dirname, '../db/migrations/003_add_packaging_type.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行迁移
    console.log('\n📦 执行迁移脚本...');
    await dbManager.query(sql);
    console.log('✅ 迁移脚本执行成功');

    // 验证迁移结果
    console.log('\n🔍 验证迁移结果...');
    
    // 检查新字段是否存在
    const columnsResult = await dbManager.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'packaging_configs' 
      AND column_name IN ('packaging_type', 'layer1_qty', 'layer2_qty', 'layer3_qty')
      ORDER BY column_name
    `);
    
    console.log('\n新增字段:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 检查约束是否存在
    const constraintResult = await dbManager.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'chk_packaging_type'
    `);
    console.log(`\n约束 chk_packaging_type: ${constraintResult.rows.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 检查索引是否存在
    const indexResult = await dbManager.query(`
      SELECT indexname FROM pg_indexes WHERE indexname = 'idx_packaging_configs_type'
    `);
    console.log(`索引 idx_packaging_configs_type: ${indexResult.rows.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

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
    console.log(`\n数据迁移结果:`);
    console.log(`  - 总配置数: ${data.total}`);
    console.log(`  - standard_box 类型: ${data.standard_box_count}`);
    console.log(`  - layer1_qty 已填充: ${data.layer1_count}`);
    console.log(`  - layer2_qty 已填充: ${data.layer2_count}`);
    console.log(`  - layer3_qty 已填充: ${data.layer3_count}`);

    // 显示示例数据
    const sampleResult = await dbManager.query(`
      SELECT id, config_name, packaging_type, layer1_qty, layer2_qty, layer3_qty
      FROM packaging_configs
      LIMIT 5
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('\n示例数据:');
      sampleResult.rows.forEach(row => {
        console.log(`  ID ${row.id}: ${row.config_name} - ${row.packaging_type} (${row.layer1_qty}/${row.layer2_qty}/${row.layer3_qty})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 包装类型迁移完成！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

// 执行迁移
runMigration();
