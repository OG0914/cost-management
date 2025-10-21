/**
 * 为包材管理模块添加测试数据
 */

const path = require('path');
const dbManager = require('../db/database');

// 初始化数据库
const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);

const db = dbManager.getDatabase();

console.log('开始添加包材测试数据...\n');

try {
  // 1. 检查是否有型号数据
  const models = db.prepare('SELECT * FROM models WHERE is_active = 1 LIMIT 3').all();
  
  if (models.length === 0) {
    console.log('❌ 没有找到型号数据，请先添加法规和型号');
    process.exit(1);
  }
  
  console.log(`找到 ${models.length} 个型号:`);
  models.forEach(m => console.log(`  - ID: ${m.id}, 型号: ${m.model_name}`));
  console.log('');
  
  // 2. 为每个型号创建包装配置
  const insertConfig = db.prepare(`
    INSERT INTO packaging_configs (model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertMaterial = db.prepare(`
    INSERT INTO packaging_materials (packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  models.forEach((model, index) => {
    // 创建标准包装配置
    const configResult = insertConfig.run(
      model.id,
      '标准包装',
      10,  // 10只/袋
      20,  // 20袋/盒
      24   // 24盒/箱
    );
    
    const configId = configResult.lastInsertRowid;
    console.log(`✅ 为型号 "${model.model_name}" 创建包装配置 (ID: ${configId})`);
    
    // 添加包材明细
    const materials = [
      { name: '内袋', usage: 1.0, price: 0.05, volume: null },
      { name: '彩盒', usage: 1.0, price: 0.80, volume: null },
      { name: '外箱', usage: 0.0417, price: 3.50, volume: 0.0625 }, // 1/24箱
      { name: '说明书', usage: 1.0, price: 0.02, volume: null },
      { name: '合格证', usage: 1.0, price: 0.01, volume: null }
    ];
    
    materials.forEach((mat, idx) => {
      insertMaterial.run(
        configId,
        mat.name,
        mat.usage,
        mat.price,
        mat.volume,
        idx
      );
    });
    
    console.log(`   添加了 ${materials.length} 个包材项目\n`);
  });
  
  console.log('========================================');
  console.log('✅ 包材测试数据添加成功！');
  console.log('========================================');
  
} catch (error) {
  console.error('❌ 添加测试数据失败:', error.message);
  process.exit(1);
}

dbManager.close();
console.log('数据库连接已关闭');
