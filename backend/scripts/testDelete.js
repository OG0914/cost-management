/**
 * 测试删除功能
 */

const PackagingConfig = require('../models/PackagingConfig');
const dbManager = require('../db/database');
const path = require('path');

// 初始化数据库
const dbPath = path.join(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);

console.log('=== 测试删除功能 ===\n');

// 1. 查看删除前的数据
console.log('1. 删除前的包装配置:');
let configs = PackagingConfig.findAll();
console.log(`   找到 ${configs.length} 个激活的配置`);
configs.forEach(c => {
  console.log(`   ID: ${c.id}, 名称: ${c.config_name}, 状态: ${c.is_active}`);
});

// 2. 执行删除 ID=4
console.log('\n2. 执行删除 ID=4...');
const result = PackagingConfig.delete(4);
console.log(`   删除结果: ${result.changes} 行受影响`);

// 3. 查看删除后的数据
console.log('\n3. 删除后的包装配置:');
configs = PackagingConfig.findAll();
console.log(`   找到 ${configs.length} 个激活的配置`);
configs.forEach(c => {
  console.log(`   ID: ${c.id}, 名称: ${c.config_name}, 状态: ${c.is_active}`);
});

// 4. 查看数据库中的实际数据（包括已删除的）
console.log('\n4. 数据库中的所有配置（包括已删除）:');
const db = dbManager.getDatabase();
const allConfigs = db.prepare('SELECT id, config_name, is_active FROM packaging_configs ORDER BY id').all();
allConfigs.forEach(c => {
  console.log(`   ID: ${c.id}, 名称: ${c.config_name}, 状态: ${c.is_active ? '激活' : '已删除'}`);
});

dbManager.close();
console.log('\n✅ 测试完成！');
