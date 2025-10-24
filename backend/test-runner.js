/**
 * 简单的测试运行器 - 用于检测任务14的代码问题
 */

const Quotation = require('./models/Quotation');
const QuotationItem = require('./models/QuotationItem');
const dbManager = require('./db/database');

// 初始化数据库
console.log('初始化数据库...');
const path = require('path');
const dbPath = path.join(__dirname, 'test.db');
dbManager.initialize(dbPath);

// 插入测试所需的基础数据
const db = dbManager.getDatabase();

// 插入测试用户
try {
  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, real_name, email)
    VALUES (1, 'testuser', 'testpass', 'admin', '测试用户', 'test@example.com')
  `).run();
  
  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, real_name, email)
    VALUES (2, 'reviewer', 'testpass', 'reviewer', '审核员', 'reviewer@example.com')
  `).run();
  
  // 插入测试法规
  db.prepare(`
    INSERT OR IGNORE INTO regulations (id, name, description)
    VALUES (1, '测试法规', '用于测试的法规类别')
  `).run();
  
  // 插入测试型号
  db.prepare(`
    INSERT OR IGNORE INTO models (id, regulation_id, model_name, remark)
    VALUES (1, 1, '测试型号', '用于测试的型号')
  `).run();
  
  console.log('测试基础数据插入完成');
} catch (error) {
  console.error('插入测试数据失败:', error);
}

let testsPassed = 0;
let testsFailed = 0;
let errors = [];

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  错误: ${error.message}`);
    testsFailed++;
    errors.push({ description, error: error.message, stack: error.stack });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`期望大于 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (actual < expected) {
        throw new Error(`期望大于等于 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeLessThanOrEqual(expected) {
      if (actual > expected) {
        throw new Error(`期望小于等于 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error('期望已定义, 但得到 undefined');
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`期望 undefined, 但得到 ${actual}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`期望 null, 但得到 ${actual}`);
      }
    },
    toMatch(regex) {
      if (!regex.test(actual)) {
        throw new Error(`期望匹配 ${regex}, 但得到 ${actual}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`期望 ${JSON.stringify(expected)}, 但得到 ${JSON.stringify(actual)}`);
      }
    }
  };
}

console.log('\n========== 测试 Quotation 模型 ==========\n');

// 测试 1: 创建报价单
test('应该成功创建报价单', () => {
  const quotationData = {
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '测试客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    currency: 'CNY',
    status: 'draft',
    created_by: 1
  };

  const id = Quotation.create(quotationData);
  expect(id).toBeGreaterThan(0);
  
  // 清理
  Quotation.delete(id);
});

// 测试 2: 使用默认值创建
test('应该使用默认值创建报价单', () => {
  const quotationData = {
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '测试客户2',
    customer_region: '华南',
    model_id: 1,
    regulation_id: 1,
    quantity: 500,
    freight_total: 300,
    freight_per_unit: 0.6,
    sales_type: 'export',
    base_cost: 8000,
    overhead_price: 9600,
    final_price: 12000,
    created_by: 1
  };

  const id = Quotation.create(quotationData);
  const quotation = Quotation.findById(id);
  
  expect(quotation.currency).toBe('CNY');
  expect(quotation.status).toBe('draft');
  
  // 清理
  Quotation.delete(id);
});

// 测试 3: 根据ID查找
test('应该根据ID查找报价单', () => {
  const id = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '查找测试客户',
    customer_region: '华北',
    model_id: 1,
    regulation_id: 1,
    quantity: 800,
    freight_total: 400,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 9000,
    overhead_price: 10800,
    final_price: 13500,
    created_by: 1
  });

  const quotation = Quotation.findById(id);
  expect(quotation).toBeDefined();
  expect(quotation.customer_name).toBe('查找测试客户');
  
  // 清理
  Quotation.delete(id);
});

// 测试 4: 查找不存在的ID
test('查找不存在的ID应返回undefined', () => {
  const quotation = Quotation.findById(999999);
  expect(quotation).toBeUndefined();
});

// 测试 5: 根据报价单编号查找
test('应该根据报价单编号查找', () => {
  const quotationNo = Quotation.generateQuotationNo();
  const id = Quotation.create({
    quotation_no: quotationNo,
    customer_name: '编号测试客户',
    customer_region: '西南',
    model_id: 1,
    regulation_id: 1,
    quantity: 600,
    freight_total: 350,
    freight_per_unit: 0.58,
    sales_type: 'export',
    base_cost: 7500,
    overhead_price: 9000,
    final_price: 11250,
    created_by: 1
  });

  const quotation = Quotation.findByQuotationNo(quotationNo);
  expect(quotation).toBeDefined();
  expect(quotation.quotation_no).toBe(quotationNo);
  
  // 清理
  Quotation.delete(id);
});

// 测试 6: 更新报价单
test('应该成功更新报价单', () => {
  const id = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '更新前客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  const success = Quotation.update(id, {
    customer_name: '更新后客户',
    quantity: 1500
  });

  expect(success).toBe(true);
  
  const updated = Quotation.findById(id);
  expect(updated.customer_name).toBe('更新后客户');
  expect(updated.quantity).toBe(1500);
  
  // 清理
  Quotation.delete(id);
});

// 测试 7: 更新状态
test('应该成功更新状态为submitted', () => {
  const id = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '状态测试客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  const success = Quotation.updateStatus(id, 'submitted');
  expect(success).toBe(true);
  
  const quotation = Quotation.findById(id);
  expect(quotation.status).toBe('submitted');
  expect(quotation.submitted_at).toBeDefined();
  
  // 清理
  Quotation.delete(id);
});

// 测试 8: 生成报价单编号
test('应该生成正确格式的报价单编号', () => {
  const quotationNo = Quotation.generateQuotationNo();
  expect(quotationNo).toMatch(/^QT\d{14}$/);
});

// 测试 9: 检查报价单是否存在
test('存在的报价单编号应返回true', () => {
  const quotationNo = Quotation.generateQuotationNo();
  const id = Quotation.create({
    quotation_no: quotationNo,
    customer_name: '存在性测试客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  expect(Quotation.exists(quotationNo)).toBe(true);
  
  // 清理
  Quotation.delete(id);
});

console.log('\n========== 测试 QuotationItem 模型 ==========\n');

// 测试 10: 创建报价单明细
test('应该成功创建报价单明细', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '明细测试客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  const itemData = {
    quotation_id: quotationId,
    category: 'material',
    item_name: '测试原料A',
    usage_amount: 10.5,
    unit_price: 100,
    subtotal: 1050
  };

  const itemId = QuotationItem.create(itemData);
  expect(itemId).toBeGreaterThan(0);
  
  // 清理
  Quotation.delete(quotationId);
});

// 测试 11: 批量创建明细
test('应该批量创建多个明细', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '批量明细测试',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  const items = [
    {
      quotation_id: quotationId,
      category: 'material',
      item_name: '原料1',
      usage_amount: 10,
      unit_price: 100,
      subtotal: 1000
    },
    {
      quotation_id: quotationId,
      category: 'process',
      item_name: '工序1',
      usage_amount: 5,
      unit_price: 300,
      subtotal: 1500
    }
  ];

  const count = QuotationItem.batchCreate(items);
  expect(count).toBe(2);
  
  const allItems = QuotationItem.findByQuotationId(quotationId);
  expect(allItems.length).toBe(2);
  
  // 清理
  Quotation.delete(quotationId);
});

// 测试 12: 根据报价单ID和分类查找
test('应该只返回指定分类的明细', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '分类测试',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  QuotationItem.batchCreate([
    {
      quotation_id: quotationId,
      category: 'material',
      item_name: '原料1',
      usage_amount: 10,
      unit_price: 100,
      subtotal: 1000
    },
    {
      quotation_id: quotationId,
      category: 'material',
      item_name: '原料2',
      usage_amount: 20,
      unit_price: 50,
      subtotal: 1000
    },
    {
      quotation_id: quotationId,
      category: 'process',
      item_name: '工序1',
      usage_amount: 5,
      unit_price: 300,
      subtotal: 1500
    }
  ]);

  const materials = QuotationItem.findByQuotationIdAndCategory(quotationId, 'material');
  expect(materials.length).toBe(2);
  
  // 清理
  Quotation.delete(quotationId);
});

// 测试 13: 计算总计
test('应该正确计算各分类和总计', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '总计测试',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  QuotationItem.batchCreate([
    {
      quotation_id: quotationId,
      category: 'material',
      item_name: '原料1',
      usage_amount: 10,
      unit_price: 100,
      subtotal: 1000
    },
    {
      quotation_id: quotationId,
      category: 'process',
      item_name: '工序1',
      usage_amount: 5,
      unit_price: 300,
      subtotal: 1500
    },
    {
      quotation_id: quotationId,
      category: 'packaging',
      item_name: '包材1',
      usage_amount: 100,
      unit_price: 2,
      subtotal: 200
    }
  ]);

  const totals = QuotationItem.calculateTotals(quotationId);
  expect(totals.material_total).toBe(1000);
  expect(totals.process_total).toBe(1500);
  expect(totals.packaging_total).toBe(200);
  expect(totals.grand_total).toBe(2700);
  
  // 清理
  Quotation.delete(quotationId);
});

// 测试 14: 标记为已修改
test('应该标记明细为已修改', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '修改标记测试',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  const itemId = QuotationItem.create({
    quotation_id: quotationId,
    category: 'material',
    item_name: '测试原料',
    usage_amount: 10,
    unit_price: 100,
    subtotal: 1000
  });

  const success = QuotationItem.markAsChanged(itemId, 900);
  expect(success).toBe(true);
  
  const item = QuotationItem.findById(itemId);
  expect(item.is_changed).toBe(1);
  expect(item.original_value).toBe(900);
  
  // 清理
  Quotation.delete(quotationId);
});

// 测试 15: 删除报价单及其明细
test('应该成功删除报价单及其明细', () => {
  const quotationId = Quotation.create({
    quotation_no: Quotation.generateQuotationNo(),
    customer_name: '删除测试客户',
    customer_region: '华东',
    model_id: 1,
    regulation_id: 1,
    quantity: 1000,
    freight_total: 500,
    freight_per_unit: 0.5,
    sales_type: 'domestic',
    base_cost: 10000,
    overhead_price: 12000,
    final_price: 15000,
    created_by: 1
  });

  QuotationItem.create({
    quotation_id: quotationId,
    category: 'material',
    item_name: '测试原料',
    usage_amount: 10,
    unit_price: 100,
    subtotal: 1000
  });

  const success = Quotation.delete(quotationId);
  expect(success).toBe(true);
  
  const quotation = Quotation.findById(quotationId);
  expect(quotation).toBeUndefined();
  
  const items = QuotationItem.findByQuotationId(quotationId);
  expect(items.length).toBe(0);
});

// 输出测试结果
console.log('\n========== 测试结果 ==========\n');
console.log(`通过: ${testsPassed}`);
console.log(`失败: ${testsFailed}`);
console.log(`总计: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n========== 错误详情 ==========\n');
  errors.forEach((err, index) => {
    console.log(`${index + 1}. ${err.description}`);
    console.log(`   ${err.error}`);
    console.log('');
  });
  process.exit(1);
} else {
  console.log('\n✓ 所有测试通过！任务14的代码没有发现问题。');
  process.exit(0);
}
