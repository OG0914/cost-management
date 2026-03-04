/**
 * 检查报价单详情API返回的数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const db = require('../db/database');
const QuotationItem = require('../models/QuotationItem');
const Quotation = require('../models/Quotation');
const SystemConfig = require('../models/SystemConfig');
const CostCalculator = require('../utils/costCalculator');

async function checkApiDetail() {
  try {
    await db.initialize();
    const pool = db.getPool();
    
    // 查询报价单
    const quotationNo = 'MK20251225-003';
    const result = await pool.query(
      'SELECT * FROM quotations WHERE quotation_no = $1',
      [quotationNo]
    );
    
    if (result.rows.length === 0) {
      logger.info('报价单不存在:', quotationNo);
      return;
    }
    
    const quotation = result.rows[0];
    logger.info('\n=== 报价单基本信息 ===');
    logger.info('ID:', quotation.id);
    logger.info('最终价格 (final_price):', quotation.final_price);
    
    // 模拟 getQuotationDetail 的逻辑
    const items = await QuotationItem.getGroupedByCategory(quotation.id);
    
    logger.info('\n=== items.process ===');
    logger.info('total:', items.process.total, typeof items.process.total);
    logger.info('items count:', items.process.items.length);
    
    // 计算原料总计
    const materialTotal = items.material.items
      .filter(item => !item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    
    const afterOverheadMaterialTotal = items.material.items
      .filter(item => item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    
    logger.info('\n=== 计算参数 ===');
    logger.info('materialTotal:', materialTotal);
    logger.info('processTotal:', parseFloat(items.process.total || 0));
    logger.info('packagingTotal:', parseFloat(items.packaging.total || 0));
    logger.info('freightTotal:', parseFloat(quotation.freight_total || 0));
    logger.info('quantity:', parseFloat(quotation.quantity || 1));
    
    // 获取系统配置
    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    logger.info('\n=== 系统配置 ===');
    logger.info('processCoefficient:', calculatorConfig.processCoefficient);
    
    const calculator = new CostCalculator(calculatorConfig);
    
    const calculation = calculator.calculateQuotation({
      materialTotal,
      processTotal: parseFloat(items.process.total || 0),
      packagingTotal: parseFloat(items.packaging.total || 0),
      freightTotal: parseFloat(quotation.freight_total || 0),
      quantity: parseFloat(quotation.quantity || 1),
      salesType: quotation.sales_type,
      includeFreightInBase: quotation.include_freight_in_base !== false,
      afterOverheadMaterialTotal
    });
    
    logger.info('\n=== 计算结果 ===');
    logger.info('baseCost:', calculation.baseCost);
    logger.info('overheadPrice:', calculation.overheadPrice);
    logger.info('domesticPrice:', calculation.domesticPrice);
    logger.info('profitTiers[0] (5%):', calculation.profitTiers[0]);
    
  } catch (err) {
    logger.error('检查失败:', err);
  } finally {
    await db.close();
  }
}

checkApiDetail();
