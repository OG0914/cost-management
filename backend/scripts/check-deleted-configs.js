/**
 * 检查数据库中已删除的配置
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.join(__dirname, '..', 'db', 'cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

console.log('=== 检查已删除的包装配置 ===\n');

try {
  // 查询所有已删除的配置
  const stmt = db.prepare(`
    SELECT id, model_id, config_name, is_active, created_at, updated_at
    FROM packaging_configs
    WHERE is_active = 0
    ORDER BY model_id, config_name
  `);
  
  const deletedConfigs = stmt.all();
  
  console.log(`找到 ${deletedConfigs.length} 个已删除的配置：\n`);
  
  if (deletedConfigs.length > 0) {
    deletedConfigs.forEach(config => {
      console.log(`ID: ${config.id}`);
      console.log(`  型号ID: ${config.model_id}`);
      console.log(`  配置名称: ${config.config_name}`);
      console.log(`  是否活跃: ${config.is_active}`);
      console.log(`  创建时间: ${config.created_at}`);
      console.log(`  更新时间: ${config.updated_at}`);
      console.log('');
    });
    
    // 检查是否有未添加删除标记的配置
    const withoutDeletedMark = deletedConfigs.filter(c => !c.config_name.includes('_deleted_'));
    
    if (withoutDeletedMark.length > 0) {
      console.log(`⚠️  发现 ${withoutDeletedMark.length} 个未添加删除标记的配置：\n`);
      withoutDeletedMark.forEach(config => {
        console.log(`  ID: ${config.id}, 名称: ${config.config_name}`);
      });
      console.log('\n建议运行修复脚本：node backend/scripts/fix-deleted-configs.js\n');
    } else {
      console.log('✓ 所有已删除的配置都已正确添加删除标记\n');
    }
  } else {
    console.log('✓ 没有已删除的配置\n');
  }
  
  // 查询所有活跃的配置
  const activeStmt = db.prepare(`
    SELECT id, model_id, config_name
    FROM packaging_configs
    WHERE is_active = 1
    ORDER BY model_id, config_name
  `);
  
  const activeConfigs = activeStmt.all();
  console.log(`当前活跃的配置数量: ${activeConfigs.length}\n`);
  
} catch (error) {
  console.error('检查失败:', error);
  process.exit(1);
} finally {
  dbManager.close();
}
