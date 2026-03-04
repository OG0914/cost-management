/**
 * 检查数据库中包装配置的 packaging_type 字段
 */
require('dotenv').config();
const logger = require('../utils/logger');
const dbManager = require('../db/database');

async function checkPackagingTypes() {
  try {
    await dbManager.initialize();
    
    const result = await dbManager.query(`
      SELECT id, config_name, packaging_type, layer1_qty, layer2_qty, layer3_qty, 
             pc_per_bag, bags_per_box, boxes_per_carton
      FROM packaging_configs
      ORDER BY id
    `);
    
    logger.info('包装配置数据:');
    logger.info(JSON.stringify(result.rows, null, 2));

    process.exit(0);
  } catch (error) {
    logger.error('查询失败:', error);
    process.exit(1);
  }
}

checkPackagingTypes();
