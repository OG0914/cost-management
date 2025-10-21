/**
 * 测试原料品号功能
 * 运行: node scripts/testMaterialWithItemNo.js
 */

require('dotenv').config();
const path = require('path');
const dbManager = require('../db/database');
const Material = require('../models/Material');

async function test() {
  try {
    console.log('========================================');
    console.log('测试原料品号功能');
    console.log('========================================\n');

    // 初始化数据库
    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);

    console.log('1. 测试创建原料（带品号）...');
    try {
      const testMaterial = {
        item_no: 'TEST001',
        name: '测试原料',
        unit: 'kg',
        price: 15.5,
        currency: 'CNY'
      };
      
      const id = Material.create(testMaterial);
      console.log(`✅ 创建成功，ID: ${id}\n`);
    } catch (error) {
      console.log(`⚠️  创建失败（可能已存在）: ${error.message}\n`);
    }

    console.log('2. 测试查询原料（按品号）...');
    const material = Material.findByItemNo('TEST001');
    if (material) {
      console.log('✅ 查询成功:');
      console.log(`   品号: ${material.item_no}`);
      console.log(`   名称: ${material.name}`);
      console.log(`   单位: ${material.unit}`);
      console.log(`   单价: ${material.price} ${material.currency}\n`);
    } else {
      console.log('❌ 未找到测试原料\n');
    }

    console.log('3. 测试更新原料...');
    if (material) {
      Material.update(material.id, {
        item_no: 'TEST001',
        name: '测试原料（已更新）',
        unit: 'kg',
        price: 20.0,
        currency: 'CNY'
      });
      console.log('✅ 更新成功\n');
    }

    console.log('4. 测试品号唯一性...');
    try {
      Material.create({
        item_no: 'TEST001',
        name: '重复品号测试',
        unit: 'kg',
        price: 10.0,
        currency: 'CNY'
      });
      console.log('❌ 品号唯一性验证失败（不应该创建成功）\n');
    } catch (error) {
      console.log('✅ 品号唯一性验证通过（正确拒绝重复品号）\n');
    }

    console.log('5. 查询所有原料...');
    const allMaterials = Material.findAll();
    console.log(`✅ 共 ${allMaterials.length} 条原料记录`);
    
    if (allMaterials.length > 0) {
      console.log('\n前 5 条记录：');
      allMaterials.slice(0, 5).forEach(m => {
        console.log(`   ${m.item_no || '(无品号)'} - ${m.name} - ${m.price} ${m.currency}`);
      });
    }

    console.log('\n========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');

    // 清理测试数据
    console.log('\n是否清理测试数据？（手动删除 TEST001）');

    dbManager.close();

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

test();
