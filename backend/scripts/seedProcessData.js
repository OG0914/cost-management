/**
 * 工序管理测试数据
 */

const dbManager = require('../db/database');
const path = require('path');

function seedProcessData() {
  try {
    const dbPath = path.join(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);
    const db = dbManager.getDatabase();

    console.log('开始插入工序测试数据...');

    // 查询现有型号
    const models = db.prepare('SELECT id, model_name FROM models WHERE is_active = 1').all();
    
    if (models.length === 0) {
      console.log('⚠️  没有找到型号数据，请先创建型号');
      dbManager.close();
      return;
    }

    console.log(`找到 ${models.length} 个型号`);

    // 为每个型号创建包装配置和工序
    const insertPackaging = db.prepare(`
      INSERT INTO packaging_configs (model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertProcess = db.prepare(`
      INSERT INTO process_configs (packaging_config_id, process_name, unit_price, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    // 示例：为型号 9600 创建包装配置
    const model9600 = models.find(m => m.model_name === '9600');
    
    if (model9600) {
      console.log('\n为型号 9600 创建包装配置...');
      
      // 包装配置 1：标准包装
      const config1 = insertPackaging.run(
        model9600.id,
        '标准包装',
        1,  // 1pc/bag
        10, // 10bags/box
        24  // 24boxes/carton
      );
      
      console.log(`✅ 创建包装配置: 标准包装 (ID: ${config1.lastInsertRowid})`);
      
      // 为标准包装添加工序
      const processes1 = [
        { name: '裁剪', price: 0.05, order: 1 },
        { name: '缝纫', price: 0.08, order: 2 },
        { name: '焊接鼻梁条', price: 0.03, order: 3 },
        { name: '焊接耳带', price: 0.04, order: 4 },
        { name: '质检', price: 0.02, order: 5 },
        { name: '包装', price: 0.01, order: 6 }
      ];
      
      processes1.forEach(p => {
        insertProcess.run(config1.lastInsertRowid, p.name, p.price, p.order);
      });
      
      console.log(`✅ 添加 ${processes1.length} 个工序`);
      
      // 包装配置 2：散装
      const config2 = insertPackaging.run(
        model9600.id,
        '散装',
        1,   // 1pc/bag
        50,  // 50bags/box
        10   // 10boxes/carton
      );
      
      console.log(`✅ 创建包装配置: 散装 (ID: ${config2.lastInsertRowid})`);
      
      // 为散装添加工序（价格略低）
      const processes2 = [
        { name: '裁剪', price: 0.04, order: 1 },
        { name: '缝纫', price: 0.07, order: 2 },
        { name: '焊接鼻梁条', price: 0.03, order: 3 },
        { name: '焊接耳带', price: 0.04, order: 4 },
        { name: '质检', price: 0.02, order: 5 },
        { name: '简易包装', price: 0.005, order: 6 }
      ];
      
      processes2.forEach(p => {
        insertProcess.run(config2.lastInsertRowid, p.name, p.price, p.order);
      });
      
      console.log(`✅ 添加 ${processes2.length} 个工序`);
    }

    // 为其他型号创建通用包装配置
    models.forEach(model => {
      if (model.model_name !== '9600') {
        console.log(`\n为型号 ${model.model_name} 创建包装配置...`);
        
        const config = insertPackaging.run(
          model.id,
          '标准包装',
          1,
          10,
          24
        );
        
        console.log(`✅ 创建包装配置: 标准包装 (ID: ${config.lastInsertRowid})`);
        
        // 添加基础工序
        const basicProcesses = [
          { name: '裁剪', price: 0.05, order: 1 },
          { name: '缝纫', price: 0.08, order: 2 },
          { name: '焊接', price: 0.06, order: 3 },
          { name: '质检', price: 0.02, order: 4 },
          { name: '包装', price: 0.01, order: 5 }
        ];
        
        basicProcesses.forEach(p => {
          insertProcess.run(config.lastInsertRowid, p.name, p.price, p.order);
        });
        
        console.log(`✅ 添加 ${basicProcesses.length} 个工序`);
      }
    });

    console.log('\n✅ 工序测试数据插入完成！');
    
    // 统计
    const packagingCount = db.prepare('SELECT COUNT(*) as count FROM packaging_configs').get();
    const processCount = db.prepare('SELECT COUNT(*) as count FROM process_configs').get();
    
    console.log(`\n📊 数据统计:`);
    console.log(`  - 包装配置: ${packagingCount.count} 条`);
    console.log(`  - 工序配置: ${processCount.count} 条`);

    dbManager.close();
  } catch (error) {
    console.error('❌ 插入测试数据失败:', error.message);
    process.exit(1);
  }
}

seedProcessData();
