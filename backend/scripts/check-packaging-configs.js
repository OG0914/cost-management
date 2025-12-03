/**
 * 检查包装配置数据
 */
const path = require('path');
const dbManager = require('../db/database');

try {
  // 初始化数据库
  const dbPath = path.join(__dirname, '../db/cost_analysis.db');
  dbManager.initialize(dbPath);
  
  const db = dbManager.getDatabase();
  
  // 查询所有型号及其分类
  console.log('=== 所有型号 ===');
  const models = db.prepare(`
    SELECT m.id, m.model_name, m.model_category, m.regulation_id, r.name as regulation_name
    FROM models m
    LEFT JOIN regulations r ON m.regulation_id = r.id
    WHERE m.is_active = 1
    ORDER BY m.model_category, m.model_name
  `).all();
  console.log(JSON.stringify(models, null, 2));
  
  // 查询所有包装配置
  console.log('\n=== 所有包装配置 ===');
  const configs = db.prepare(`
    SELECT 
      pc.id, pc.config_name, pc.model_id,
      m.model_name, m.model_category, m.regulation_id,
      r.name as regulation_name
    FROM packaging_configs pc
    JOIN models m ON pc.model_id = m.id
    JOIN regulations r ON m.regulation_id = r.id
    WHERE pc.is_active = 1
    ORDER BY m.model_category, m.model_name
  `).all();
  console.log(JSON.stringify(configs, null, 2));
  
  // 统计每个型号分类的包装配置数量
  console.log('\n=== 按型号分类统计包装配置 ===');
  const stats = db.prepare(`
    SELECT m.model_category, COUNT(pc.id) as config_count
    FROM packaging_configs pc
    JOIN models m ON pc.model_id = m.id
    WHERE pc.is_active = 1
    GROUP BY m.model_category
  `).all();
  console.log(JSON.stringify(stats, null, 2));
  
} catch (error) {
  console.error('错误:', error);
}
