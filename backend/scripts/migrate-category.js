/**
 * 原料类别迁移脚本
 */
const db = require('../db/database');

async function migrate() {
  try {
    // 1. 添加category字段
    await db.query('ALTER TABLE materials ADD COLUMN IF NOT EXISTS category VARCHAR(50)');
    console.log('✓ 已添加 category 字段');

    // 2. 创建索引
    await db.query('CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category)');
    console.log('✓ 已创建索引');

    // 3. 添加配置（空数组，由用户自行配置）
    await db.query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES ('material_categories', '[]', '原料类别配置')
      ON CONFLICT (config_key) DO NOTHING
    `);
    console.log('✓ 已添加类别配置');

    console.log('\n迁移完成！');
    process.exit(0);
  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
