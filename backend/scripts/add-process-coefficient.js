/**
 * 数据库迁移脚本：添加工价系数配置
 * 用于将 process_coefficient 配置项添加到现有数据库
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.join(__dirname, '..', 'db', 'cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

console.log('开始添加工价系数配置...\n');

try {
  // 检查配置是否已存在
  const checkStmt = db.prepare('SELECT * FROM system_config WHERE config_key = ?');
  const existing = checkStmt.get('process_coefficient');

  if (existing) {
    console.log('✓ 工价系数配置已存在');
    console.log('  当前值:', existing.config_value);
    console.log('  描述:', existing.description);
  } else {
    // 插入新配置
    const insertStmt = db.prepare(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES (?, ?, ?)
    `);
    
    insertStmt.run('process_coefficient', '1.56', '工价系数');
    
    console.log('✓ 成功添加工价系数配置');
    console.log('  配置键: process_coefficient');
    console.log('  默认值: 1.56');
    console.log('  描述: 工价系数');
  }

  console.log('\n迁移完成！');
  
  // 显示所有配置
  console.log('\n当前系统配置：');
  const allConfigsStmt = db.prepare('SELECT * FROM system_config ORDER BY config_key');
  const allConfigs = allConfigsStmt.all();
  
  allConfigs.forEach(config => {
    console.log(`  ${config.config_key}: ${config.config_value} (${config.description})`);
  });

} catch (error) {
  console.error('迁移失败:', error);
  process.exit(1);
} finally {
  dbManager.close();
}
