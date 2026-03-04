/**
 * 直接调用 getQuotationDetail 的逻辑检查返回数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
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
    logger.info('报价单不存在');
    await db.close();
    return;
  }

  const id = qResult.rows[0].id;
  logger.info('报价单ID:', id);

  // 完全模拟 getQuotationDetail 的逻辑
  const quotation = await Quotation.findById(id);
  logger.info('\n=== quotation ===');
  logger.info('final_price:', quotation.final_price);
  logger.info('quantity:', quotation.quantity);
  logger.info('freight_total:', quotation.freight_total);

  const items = await QuotationItem.getGroupedByCategory(id);
  logger.info('\n=== items.process ===');
  logger.info('total:', items.process.total, 'type:', typeof items.process.total);

  // 获取原料系数
  let materialCoefficient = 1;
  const model = await Model.findById(quotation.model_id);
  if (model && model.model_category) {
    const coefficients = await SystemConfig.getValue('material_coefficients') || {};
    materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
  }
  logger.info('materialCoefficient:', materialCoefficient);

  const calculatorConfig = await SystemConfig.getCalculatorConfig();
  if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
    calculatorConfig.vatRate = parseFloat(quotation.vat_rate); // 修复：PostgreSQL DECIMAL返回字符串
  }
  logger.info('\n=== calculatorConfig ===');
  logger.info('processCoefficient:', calculatorConfig.processCoefficient);
  logger.info('vatRate:', calculatorConfig.vatRate, 'type:', typeof calculatorConfig.vatRate);

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

  logger.info('\n=== 计算参数 ===');
  logger.info('materialTotal:', materialTotal);
  logger.info('processTotal:', parseFloat(items.process.total || 0));
  logger.info('packagingTotal:', parseFloat(items.packaging.total || 0));
  logger.info('freightTotal:', parseFloat(quotation.freight_total || 0));
  logger.info('quantity:', parseFloat(quotation.quantity || 1));
  logger.info('afterOverheadMaterialTotal:', afterOverheadMaterialTotal);
  logger.info('customFees:', customFees);

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

  logger.info('\n=== calculation 结果 ===');
  logger.info('baseCost:', calculation.baseCost);
  logger.info('overheadPrice:', calculation.overheadPrice);
  logger.info('domesticPrice:', calculation.domesticPrice);
  logger.info('profitTiers:');
  calculation.profitTiers.forEach(tier => {
    logger.info(`  ${tier.profitPercentage}: ${tier.price}`);
  });

  logger.info('\n=== JSON 输出（模拟 API 响应）===');
  logger.info(JSON.stringify({ profitTiers: calculation.profitTiers }, null, 2));
  
  await db.close();
})();
