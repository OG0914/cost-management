/** 执行迁移脚本：添加 calculation_rules 系统配置 */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const defaultCalculationRules = {
  '半面罩': {
    '主体': {
      material: { formula: 'multiply', coefficient: 0.99 },
      packaging: { formula: 'divide', coefficient: 1 }
    },
    '配件': {
      material: { formula: 'multiply', coefficient: 0.99 },
      packaging: { formula: 'divide', coefficient: 1 }
    },
    '滤毒盒': {
      material: { formula: 'multiply', coefficient: 0.95 },
      packaging: { formula: 'divide', coefficient: 0.97 }
    },
    '滤棉': {
      material: { formula: 'divide', coefficient: 0.97 },
      packaging: { formula: 'divide', coefficient: 1 }
    },
    '滤饼': {
      material: { formula: 'divide', coefficient: 0.97 },
      packaging: { formula: 'divide', coefficient: 1 }
    }
  }
};

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('开始执行迁移...');

    // 检查是否已存在 calculation_rules 配置
    const checkResult = await client.query(
      "SELECT COUNT(*) as count FROM system_config WHERE config_key = 'calculation_rules'"
    );

    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('✓ calculation_rules 配置已存在，跳过');
    } else {
      // 插入默认配置
      await client.query(
        `INSERT INTO system_config (config_key, config_value, description)
         VALUES ($1, $2, $3)`,
        [
          'calculation_rules',
          JSON.stringify(defaultCalculationRules),
          '半面罩产品计算规则配置，支持动态修改计算公式和系数'
        ]
      );
      console.log('✓ 添加 calculation_rules 默认配置');
    }

    console.log('迁移完成！');
  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
