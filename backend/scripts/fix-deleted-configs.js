/**
 * 修复已删除但未添加删除标记的配置
 * 为所有 is_active = 0 但配置名称未包含 _deleted_ 的记录添加删除标记
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.join(__dirname, '..', 'db', 'cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

console.log('=== 修复已删除的包装配置 ===\n');

try {
  // 查询所有需要修复的配置
  const selectStmt = db.prepare(`
    SELECT id, model_id, config_name
    FROM packaging_configs
    WHERE is_active = 0 AND config_name NOT LIKE '%_deleted_%'
    ORDER BY id
  `);
  
  const configsToFix = selectStmt.all();
  
  if (configsToFix.length === 0) {
    console.log('✓ 没有需要修复的配置\n');
    return;
  }
  
  console.log(`找到 ${configsToFix.length} 个需要修复的配置：\n`);
  
  configsToFix.forEach(config => {
    console.log(`ID: ${config.id}, 名称: ${config.config_name}`);
  });
  
  console.log('\n开始修复...\n');
  
  // 准备更新语句
  const updateStmt = db.prepare(`
    UPDATE packaging_configs
    SET config_name = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  // 使用事务批量更新
  const updateAll = db.transaction((configs) => {
    let successCount = 0;
    let failCount = 0;
    
    for (const config of configs) {
      try {
        // 生成新的配置名称
        const deletedName = `${config.config_name}_deleted_${Date.now()}_${config.id}`;
        
        // 更新配置
        updateStmt.run(deletedName, config.id);
        
        console.log(`✓ ID ${config.id}: ${config.config_name} → ${deletedName}`);
        successCount++;
        
        // 添加小延迟确保时间戳不同
        const start = Date.now();
        while (Date.now() - start < 2) {}
        
      } catch (error) {
        console.log(`✗ ID ${config.id}: 修复失败 - ${error.message}`);
        failCount++;
      }
    }
    
    return { successCount, failCount };
  });
  
  const result = updateAll(configsToFix);
  
  console.log(`\n修复完成！`);
  console.log(`  成功: ${result.successCount} 个`);
  console.log(`  失败: ${result.failCount} 个\n`);
  
  // 验证修复结果
  console.log('验证修复结果...\n');
  const verifyStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM packaging_configs
    WHERE is_active = 0 AND config_name NOT LIKE '%_deleted_%'
  `);
  
  const remaining = verifyStmt.get();
  
  if (remaining.count === 0) {
    console.log('✓ 所有配置已成功修复\n');
  } else {
    console.log(`⚠️  仍有 ${remaining.count} 个配置未修复\n`);
  }
  
} catch (error) {
  console.error('修复失败:', error);
  process.exit(1);
} finally {
  dbManager.close();
}
