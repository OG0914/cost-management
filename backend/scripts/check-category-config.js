/**
 * 检查原料类别配置
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const logger = require('../utils/logger');
const db = require('../db/database');

async function check() {
  try {
    await db.initialize();
    const result = await db.query("SELECT * FROM system_config WHERE config_key = 'material_categories'");
    logger.info('查询结果:', result.rows);
    if (result.rows.length === 0) {
      logger.info('\n配置不存在，需要创建！');
      await db.query(`INSERT INTO system_config (config_key, config_value, description) VALUES ('material_categories', '[]', '原料类别配置')`);
      logger.info('✓ 已创建配置');
    }
    process.exit(0);
  } catch (err) {
    logger.error('失败:', err.message);
    process.exit(1);
  }
}

check();
