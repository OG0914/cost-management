/** 执行迁移脚本 010_add_estimation_fields.sql */
const { Pool } = require('pg');
const path = require('path');
const logger = require('../../utils/logger');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();
  try {
    logger.info('开始执行迁移...');
    
    await client.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_estimation BOOLEAN DEFAULT false`);
    logger.info('✓ 添加 is_estimation 字段');
    
    await client.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS reference_standard_cost_id INTEGER REFERENCES standard_costs(id)`);
    logger.info('✓ 添加 reference_standard_cost_id 字段');
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quotations_is_estimation ON quotations(is_estimation)`);
    logger.info('✓ 创建索引 idx_quotations_is_estimation');
    
    logger.info('迁移完成！');
  } catch (err) {
    logger.error('迁移失败:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
