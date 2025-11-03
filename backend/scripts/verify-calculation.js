/**
 * 验证成本计算逻辑
 */

const CostCalculator = require('../utils/costCalculator');

const config = {
  overheadRate: 0.2,
  vatRate: 0.13,
  exchangeRate: 7.2,
  insuranceRate: 0.003,
  profitTiers: [0.05, 0.10, 0.25, 0.50]
};

const calculator = new CostCalculator(config);

console.log('验证成本计算逻辑\n');
console.log('测试数据：');
console.log('  原料: 100, 工序: 50, 包材: 30, 运费: 20, 数量: 1000');
console.log('  运费成本（每片）: 0.02\n');

// 测试1：内销 + 运费计入
console.log('='.repeat(60));
console.log('测试1：内销 + 运费计入成本（是）');
console.log('='.repeat(60));
const test1 = calculator.calculateQuotation({
  materialTotal: 100,
  processTotal: 50,
  packagingTotal: 30,
  freightTotal: 20,
  quantity: 1000,
  salesType: 'domestic',
  includeFreightInBase: true
});
console.log('基础成本价:', test1.baseCost);
console.log('管销价:', test1.overheadPrice);
console.log('最终成本价（含13%增值税）:', test1.domesticPrice, 'CNY');
console.log('利润报价（5%）:', test1.profitTiers[0].price, 'CNY\n');

// 测试2：内销 + 运费不计入
console.log('='.repeat(60));
console.log('测试2：内销 + 运费计入成本（否）');
console.log('='.repeat(60));
const test2 = calculator.calculateQuotation({
  materialTotal: 100,
  processTotal: 50,
  packagingTotal: 30,
  freightTotal: 20,
  quantity: 1000,
  salesType: 'domestic',
  includeFreightInBase: false
});
console.log('基础成本价:', test2.baseCost);
console.log('管销价:', test2.overheadPrice);
console.log('最终成本价（含13%增值税）:', test2.domesticPrice, 'CNY');
console.log('利润报价（5%）:', test2.profitTiers[0].price, 'CNY\n');

// 测试3：外销 + 运费计入
console.log('='.repeat(60));
console.log('测试3：外销 + 运费计入成本（是）');
console.log('='.repeat(60));
const test3 = calculator.calculateQuotation({
  materialTotal: 100,
  processTotal: 50,
  packagingTotal: 30,
  freightTotal: 20,
  quantity: 1000,
  salesType: 'export',
  includeFreightInBase: true
});
console.log('基础成本价:', test3.baseCost);
console.log('管销价:', test3.overheadPrice);
console.log('最终成本价（不含增值税）:', test3.exportPrice, 'USD');
console.log('保险价:', test3.insurancePrice, 'USD');
console.log('利润报价（5%）:', test3.profitTiers[0].price, 'USD\n');

// 测试4：外销 + 运费不计入
console.log('='.repeat(60));
console.log('测试4：外销 + 运费计入成本（否）');
console.log('='.repeat(60));
const test4 = calculator.calculateQuotation({
  materialTotal: 100,
  processTotal: 50,
  packagingTotal: 30,
  freightTotal: 20,
  quantity: 1000,
  salesType: 'export',
  includeFreightInBase: false
});
console.log('基础成本价:', test4.baseCost);
console.log('管销价:', test4.overheadPrice);
console.log('最终成本价（不含增值税）:', test4.exportPrice, 'USD');
console.log('保险价:', test4.insurancePrice, 'USD');
console.log('利润报价（5%）:', test4.profitTiers[0].price, 'USD\n');

console.log('='.repeat(60));
console.log('关键点：');
console.log('  - final_price 应该是 domesticPrice 或 exportPrice');
console.log('  - 不应该是 profitTiers[0].price（那是加了利润的）');
console.log('='.repeat(60));
