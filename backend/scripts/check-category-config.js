/**
 * 检查原料类别配置
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db/database');

async function check() {
  try {
    await db.initialize();
    const result = await db.query("SELECT * FROM system_config WHERE config_key = 'material_categories'");
    console.log('查询结果:', result.rows);
    if (result.rows.length === 0) {
      console.log('\n配置不存在，需要创建！');
      await db.query(`INSERT INTO system_config (config_key, config_value, description) VALUES ('material_categories', '[]', '原料类别配置')`);
      console.log('✓ 已创建配置');
    }
    process.exit(0);
  } catch (err) {
    console.error('失败:', err.message);
    process.exit(1);
  }
}

check();
