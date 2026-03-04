/** 执行迁移脚本：为 models 表添加 calculation_type 字段 */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('开始执行迁移...');

    await client.query(`ALTER TABLE models ADD COLUMN IF NOT EXISTS calculation_type VARCHAR(20)`);
    console.log('✓ 添加 calculation_type 字段');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_models_calculation_type ON models(calculation_type)`);
    console.log('✓ 创建索引 idx_models_calculation_type');

    console.log('迁移完成！');
  } catch (err) {
    console.error('迁移失败:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
