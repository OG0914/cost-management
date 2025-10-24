/**
 * 测试数据生成脚本
 * 用于快速填充系统测试数据
 */

const path = require('path');
const dbManager = require('../db/database');
const bcrypt = require('bcrypt');

// 初始化数据库
const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
dbManager.initialize(dbPath);
const db = dbManager.getDatabase();

console.log('开始生成测试数据...\n');

// 1. 创建测试用户
console.log('1. 创建测试用户...');
const users = [
  { username: 'admin', password: 'admin123', role: 'admin', real_name: '系统管理员', email: 'admin@test.com' },
  { username: 'salesperson', password: 'sales123', role: 'salesperson', real_name: '张业务', email: 'sales@test.com' },
  { username: 'reviewer', password: 'review123', role: 'reviewer', real_name: '李审核', email: 'review@test.com' },
  { username: 'purchaser', password: 'purchase123', role: 'purchaser', real_name: '王采购', email: 'purchase@test.com' },
  { username: 'producer', password: 'produce123', role: 'producer', real_name: '赵生产', email: 'produce@test.com' }
];

users.forEach(user => {
  try {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    db.prepare(`
      INSERT OR REPLACE INTO users (username, password, role, real_name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.username, hashedPassword, user.role, user.real_name, user.email);
    console.log(`  ✓ 创建用户: ${user.username} (密码: ${user.password})`);
  } catch (error) {
    console.log(`  ✗ 用户 ${user.username} 已存在`);
  }
});

// 2. 创建法规类别
console.log('\n2. 创建法规类别...');
const regulations = [
  { name: 'NIOSH', description: '美国国家职业安全卫生研究所标准' },
  { name: 'GB', description: '中国国家标准' },
  { name: 'CE', description: '欧盟CE认证标准' },
  { name: 'ASNZS', description: '澳大利亚/新西兰标准' }
];

regulations.forEach(reg => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO regulations (name, description)
      VALUES (?, ?)
    `).run(reg.name, reg.description);
    console.log(`  ✓ 创建法规: ${reg.name}`);
  } catch (error) {
    console.log(`  ✗ 法规 ${reg.name} 创建失败`);
  }
});

// 3. 创建型号
console.log('\n3. 创建型号...');
const models = [
  { regulation_id: 1, model_name: 'N95', remark: 'NIOSH N95防护口罩' },
  { regulation_id: 1, model_name: 'N99', remark: 'NIOSH N99防护口罩' },
  { regulation_id: 2, model_name: 'KN95', remark: 'GB2626-2019 KN95' },
  { regulation_id: 2, model_name: 'KN100', remark: 'GB2626-2019 KN100' },
  { regulation_id: 3, model_name: 'FFP2', remark: 'CE FFP2防护口罩' },
  { regulation_id: 3, model_name: 'FFP3', remark: 'CE FFP3防护口罩' }
];

models.forEach(model => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO models (regulation_id, model_name, remark)
      VALUES (?, ?, ?)
    `).run(model.regulation_id, model.model_name, model.remark);
    console.log(`  ✓ 创建型号: ${model.model_name}`);
  } catch (error) {
    console.log(`  ✗ 型号 ${model.model_name} 创建失败`);
  }
});

// 4. 创建原料数据
console.log('\n4. 创建原料数据...');
const materials = [
  { item_no: 'M001', name: '熔喷布', unit: 'kg', price: 150, model_id: 1, usage_amount: 0.05 },
  { item_no: 'M002', name: '无纺布', unit: 'kg', price: 80, model_id: 1, usage_amount: 0.08 },
  { item_no: 'M003', name: '鼻梁条', unit: '根', price: 0.05, model_id: 1, usage_amount: 1 },
  { item_no: 'M004', name: '耳带', unit: '根', price: 0.02, model_id: 1, usage_amount: 2 },
  { item_no: 'M005', name: '海绵条', unit: '根', price: 0.03, model_id: 1, usage_amount: 1 },
  { item_no: 'M006', name: '熔喷布-高级', unit: 'kg', price: 180, model_id: 2, usage_amount: 0.06 },
  { item_no: 'M007', name: '活性炭', unit: 'kg', price: 120, model_id: 2, usage_amount: 0.02 }
];

materials.forEach(mat => {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO materials (item_no, name, unit, price, model_id, usage_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(mat.item_no, mat.name, mat.unit, mat.price, mat.model_id, mat.usage_amount);
    console.log(`  ✓ 创建原料: ${mat.name} (${mat.item_no})`);
  } catch (error) {
    console.log(`  ✗ 原料 ${mat.name} 创建失败`);
  }
});

// 5. 创建工序数据
console.log('\n5. 创建工序数据...');
const processes = [
  { name: '裁剪', price: 0.15, model_id: 1 },
  { name: '缝合', price: 0.20, model_id: 1 },
  { name: '焊接', price: 0.18, model_id: 1 },
  { name: '质检', price: 0.10, model_id: 1 },
  { name: '包装', price: 0.08, model_id: 1 },
  { name: '裁剪-精密', price: 0.20, model_id: 2 },
  { name: '缝合-加固', price: 0.25, model_id: 2 },
  { name: '活性炭填充', price: 0.15, model_id: 2 }
];

processes.forEach(proc => {
  try {
    db.prepare(`
      INSERT INTO processes (name, price, model_id)
      VALUES (?, ?, ?)
    `).run(proc.name, proc.price, proc.model_id);
    console.log(`  ✓ 创建工序: ${proc.name}`);
  } catch (error) {
    console.log(`  ✗ 工序 ${proc.name} 创建失败`);
  }
});

// 6. 创建包材数据
console.log('\n6. 创建包材数据...');
const packaging = [
  { name: '内包装袋', usage_amount: 1, price: 0.05, model_id: 1 },
  { name: '外包装盒', usage_amount: 0.1, price: 0.50, model_id: 1 },
  { name: '说明书', usage_amount: 1, price: 0.02, model_id: 1 },
  { name: '合格证', usage_amount: 1, price: 0.01, model_id: 1 },
  { name: '内包装袋-加厚', usage_amount: 1, price: 0.08, model_id: 2 },
  { name: '外包装盒-精装', usage_amount: 0.1, price: 0.80, model_id: 2 }
];

packaging.forEach(pack => {
  try {
    db.prepare(`
      INSERT INTO packaging (name, usage_amount, price, model_id)
      VALUES (?, ?, ?, ?)
    `).run(pack.name, pack.usage_amount, pack.price, pack.model_id);
    console.log(`  ✓ 创建包材: ${pack.name}`);
  } catch (error) {
    console.log(`  ✗ 包材 ${pack.name} 创建失败`);
  }
});

// 7. 创建测试报价单
console.log('\n7. 创建测试报价单...');

// 获取业务员ID
const salesperson = db.prepare('SELECT id FROM users WHERE username = ?').get('salesperson');

if (salesperson) {
  const quotations = [
    {
      quotation_no: 'QT20251024000001',
      customer_name: '测试客户A',
      customer_region: '华东',
      model_id: 1,
      regulation_id: 1,
      quantity: 10000,
      freight_total: 500,
      freight_per_unit: 0.05,
      sales_type: 'domestic',
      base_cost: 1.50,
      overhead_price: 1.875,
      final_price: 2.119,
      status: 'draft',
      created_by: salesperson.id
    },
    {
      quotation_no: 'QT20251024000002',
      customer_name: '测试客户B',
      customer_region: '华南',
      model_id: 1,
      regulation_id: 1,
      quantity: 20000,
      freight_total: 800,
      freight_per_unit: 0.04,
      sales_type: 'export',
      base_cost: 1.45,
      overhead_price: 1.8125,
      final_price: 0.2517,
      currency: 'USD',
      status: 'submitted',
      created_by: salesperson.id
    },
    {
      quotation_no: 'QT20251024000003',
      customer_name: '测试客户C',
      customer_region: '华北',
      model_id: 2,
      regulation_id: 1,
      quantity: 15000,
      freight_total: 600,
      freight_per_unit: 0.04,
      sales_type: 'domestic',
      base_cost: 1.80,
      overhead_price: 2.25,
      final_price: 2.543,
      status: 'approved',
      created_by: salesperson.id
    }
  ];

  quotations.forEach((quot, index) => {
    try {
      const result = db.prepare(`
        INSERT INTO quotations (
          quotation_no, customer_name, customer_region, model_id, regulation_id,
          quantity, freight_total, freight_per_unit, sales_type,
          base_cost, overhead_price, final_price, currency, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        quot.quotation_no, quot.customer_name, quot.customer_region,
        quot.model_id, quot.regulation_id, quot.quantity,
        quot.freight_total, quot.freight_per_unit, quot.sales_type,
        quot.base_cost, quot.overhead_price, quot.final_price,
        quot.currency || 'CNY', quot.status, quot.created_by
      );

      const quotationId = result.lastInsertRowid;

      // 添加明细
      const items = [
        { category: 'material', item_name: '熔喷布', usage_amount: 0.05, unit_price: 150, subtotal: 7.5 },
        { category: 'material', item_name: '无纺布', usage_amount: 0.08, unit_price: 80, subtotal: 6.4 },
        { category: 'process', item_name: '裁剪', usage_amount: 1, unit_price: 0.15, subtotal: 0.15 },
        { category: 'process', item_name: '缝合', usage_amount: 1, unit_price: 0.20, subtotal: 0.20 },
        { category: 'packaging', item_name: '内包装袋', usage_amount: 1, unit_price: 0.05, subtotal: 0.05 }
      ];

      items.forEach(item => {
        db.prepare(`
          INSERT INTO quotation_items (
            quotation_id, category, item_name, usage_amount, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(quotationId, item.category, item.item_name, item.usage_amount, item.unit_price, item.subtotal);
      });

      console.log(`  ✓ 创建报价单: ${quot.quotation_no} (${quot.customer_name})`);
    } catch (error) {
      console.log(`  ✗ 报价单创建失败: ${error.message}`);
    }
  });
}

console.log('\n✅ 测试数据生成完成！\n');
console.log('测试账号信息：');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('管理员    - 用户名: admin       密码: admin123');
console.log('业务员    - 用户名: salesperson  密码: sales123');
console.log('审核人    - 用户名: reviewer     密码: review123');
console.log('采购人员  - 用户名: purchaser    密码: purchase123');
console.log('生产人员  - 用户名: producer     密码: produce123');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 关闭数据库
dbManager.close();
