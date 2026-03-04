/**
 * 清空原料类别配置
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const logger = require('../utils/logger');
const db = require('../db/database');

async function clear() {
  try {
    await db.initialize();
    await db.query(`UPDATE system_config SET config_value = '[]' WHERE config_key = 'material_categories'`);
    logger.info('✓ 已清空原料类别配置');
    process.exit(0);
  } catch (err) {
    logger.error('失败:', err.message);
    process.exit(1);
  }
}

clear();
