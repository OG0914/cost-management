/**
 * 直接调用 getQuotationDetail 的逻辑检查返回数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db/database');
const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const QuotationCustomFee = require('../models/QuotationCustomFee');
const SystemConfig = require('../models/SystemConfig');
const Model = require('../models/Model');
const CostCalculator = require('../utils/costCalculator');

(async () => {
  await db.initialize();
  
  // 查询报价单
  const quotationNo = 'MK20251225-004';
  const pool = db.getPool();
  const qResult = await pool.query("SELECT id FROM quotations WHERE quotation_no = $1", [quotationNo]);
  
  if (qResult.rows.length === 0) {
    console.log('报价单不存在');
    await db.close();
    return;
  }
  
  const id = qResult.rows[0].id;
  console.log('报价单ID:', id);
  
  // 完全模拟 getQuotationDetail 的逻辑
  const quotation = await Quotation.findById(id);
  console.log('\n=== quotation ===');
  console.log('final_price:', quotation.final_price);
  console.log('quantity:', quotation.quantity);
  console.log('freight_total:', quotation.freight_total);
  
  const items = await QuotationItem.getGroupedByCategory(id);
  console.log('\n=== items.process ===');
  console.log('total:', items.process.total, 'type:', typeof items.process.total);
  
  // 获取原料系数
  let materialCoefficient = 1;
  const model = await Model.findById(quotation.model_id);
  if (model && model.model_category) {
    const coefficients = await SystemConfig.getValue('material_coefficients') || {};
    materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
  }
  console.log('materialCoefficient:', materialCoefficient);
  
  const calculatorConfig = await SystemConfig.getCalculatorConfig();
  if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
    calculatorConfig.vatRate = parseFloat(quotation.vat_rate); // 修复：PostgreSQL DECIMAL返回字符串
  }
  console.log('\n=== calculatorConfig ===');
  console.log('processCoefficient:', calculatorConfig.processCoefficient);
  console.log('vatRate:', calculatorConfig.vatRate, 'type:', typeof calculatorConfig.vatRate);
  
  const calculator = new CostCalculator(calculatorConfig);
  
  const materialTotal = items.material.items
    .filter(item => !item.after_overhead)
    .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  
  const afterOverheadMaterialTotal = items.material.items
    .filter(item => item.after_overhead)
    .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  
  const customFeesFromDb = await QuotationCustomFee.findByQuotationId(id);
  const customFees = customFeesFromDb.map(fee => ({
    name: fee.fee_name,
    rate: fee.fee_rate,
    sortOrder: fee.sort_order
  }));
  
  console.log('\n=== 计算参数 ===');
  console.log('materialTotal:', materialTotal);
  console.log('processTotal:', parseFloat(items.process.total || 0));
  console.log('packagingTotal:', parseFloat(items.packaging.total || 0));
  console.log('freightTotal:', parseFloat(quotation.freight_total || 0));
  console.log('quantity:', parseFloat(quotation.quantity || 1));
  console.log('afterOverheadMaterialTotal:', afterOverheadMaterialTotal);
  console.log('customFees:', customFees);
  
  const calculation = calculator.calculateQuotation({
    materialTotal,
    processTotal: parseFloat(items.process.total || 0),
    packagingTotal: parseFloat(items.packaging.total || 0),
    freightTotal: parseFloat(quotation.freight_total || 0),
    quantity: parseFloat(quotation.quantity || 1),
    salesType: quotation.sales_type,
    includeFreightInBase: quotation.include_freight_in_base !== false,
    afterOverheadMaterialTotal,
    customFees
  });
  
  console.log('\n=== calculation 结果 ===');
  console.log('baseCost:', calculation.baseCost);
  console.log('overheadPrice:', calculation.overheadPrice);
  console.log('domesticPrice:', calculation.domesticPrice);
  console.log('profitTiers:');
  calculation.profitTiers.forEach(tier => {
    console.log(`  ${tier.profitPercentage}: ${tier.price}`);
  });
  
  console.log('\n=== JSON 输出（模拟 API 响应）===');
  console.log(JSON.stringify({ profitTiers: calculation.profitTiers }, null, 2));
  
  await db.close();
})();
