/**
 * 模拟编辑模式下的计算流程
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db/database');
const QuotationItem = require('../models/QuotationItem');
const SystemConfig = require('../models/SystemConfig');
const CostCalculator = require('../utils/costCalculator');

(async () => {
  await db.initialize();
  
  const quotationNo = 'MK20251225-004';
  const q = await db.getPool().query("SELECT * FROM quotations WHERE quotation_no = $1", [quotationNo]);
  
  if (q.rows.length === 0) {
    console.log('报价单不存在');
    await db.close();
    return;
  }
  
  const quotation = q.rows[0];
  console.log('=== 报价单基本信息 ===');
  console.log('ID:', quotation.id);
  console.log('final_price:', quotation.final_price);
  
  // 模拟 getQuotationDetail 返回的 items
  const items = await QuotationItem.getGroupedByCategory(quotation.id);
  
  console.log('\n=== getGroupedByCategory 返回的 items.process ===');
  console.log('total:', items.process.total);
  console.log('items:');
  items.process.items.forEach(item => {
    console.log(`  ${item.item_name}: subtotal=${item.subtotal}, type=${typeof item.subtotal}`);
  });
  
  // 模拟前端 loadQuotationData 后的 form.processes
  const formProcesses = items.process.items.map(item => ({
    category: 'process',
    item_name: item.item_name,
    usage_amount: parseFloat(item.usage_amount) || 0,
    unit_price: parseFloat(item.unit_price) || 0,
    subtotal: parseFloat(item.subtotal) || 0,
    from_standard: true
  }));
  
  console.log('\n=== 模拟前端 form.processes ===');
  formProcesses.forEach(p => {
    console.log(`  ${p.item_name}: subtotal=${p.subtotal}`);
  });
  
  // 模拟前端调用 /cost/calculate 时传递的 items
  const allItems = [
    ...items.material.items.map(item => ({
      category: 'material',
      subtotal: parseFloat(item.subtotal) || 0,
      after_overhead: item.after_overhead,
      coefficient_applied: true
    })),
    ...formProcesses,
    ...items.packaging.items.map(item => ({
      category: 'packaging',
      subtotal: parseFloat(item.subtotal) || 0
    }))
  ];
  
  // 模拟后端 calculateQuotation 的计算
  const materialTotal = allItems
    .filter(item => item.category === 'material' && !item.after_overhead)
    .reduce((sum, item) => sum + item.subtotal, 0);
  
  const processTotal = allItems
    .filter(item => item.category === 'process')
    .reduce((sum, item) => sum + item.subtotal, 0);
  
  const packagingTotal = allItems
    .filter(item => item.category === 'packaging')
    .reduce((sum, item) => sum + item.subtotal, 0);
  
  console.log('\n=== 计算参数 ===');
  console.log('materialTotal:', materialTotal);
  console.log('processTotal:', processTotal);
  console.log('packagingTotal:', packagingTotal);
  
  const calculatorConfig = await SystemConfig.getCalculatorConfig();
  const calculator = new CostCalculator(calculatorConfig);
  
  const calculation = calculator.calculateQuotation({
    materialTotal,
    processTotal,
    packagingTotal,
    freightTotal: parseFloat(quotation.freight_total) || 0,
    quantity: parseFloat(quotation.quantity) || 1,
    salesType: quotation.sales_type,
    includeFreightInBase: quotation.include_freight_in_base !== false
  });
  
  console.log('\n=== 计算结果 ===');
  console.log('baseCost:', calculation.baseCost);
  console.log('domesticPrice:', calculation.domesticPrice);
  console.log('profitTiers[0] (5%):', calculation.profitTiers[0]);
  
  console.log('\n=== 对比 ===');
  console.log('数据库 final_price:', quotation.final_price);
  console.log('计算 domesticPrice:', calculation.domesticPrice);
  console.log('是否一致:', Math.abs(parseFloat(quotation.final_price) - calculation.domesticPrice) < 0.001);
  
  await db.close();
})();
