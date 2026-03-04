/**
 * 检查报价单数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const db = require('../db/database');

async function checkQuotation() {
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
    logger.info('编号:', quotation.quotation_no);
    logger.info('数量 (quantity):', quotation.quantity, typeof quotation.quantity);
    logger.info('运费总价 (freight_total):', quotation.freight_total, typeof quotation.freight_total);
    logger.info('销售类型:', quotation.sales_type);
    logger.info('基础成本:', quotation.base_cost);
    logger.info('管销价:', quotation.overhead_price);
    logger.info('最终价格:', quotation.final_price);
    logger.info('币别:', quotation.currency);

    // 查询明细
    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1',
      [quotation.id]
    );

    logger.info('\n=== 报价单明细 ===');
    logger.info('明细数量:', itemsResult.rows.length);

    let materialTotal = 0;
    let processTotal = 0;
    let packagingTotal = 0;

    itemsResult.rows.forEach(item => {
      logger.info(`- ${item.category}: ${item.item_name}, 小计: ${item.subtotal}`);
      if (item.category === 'material') materialTotal += parseFloat(item.subtotal) || 0;
      if (item.category === 'process') processTotal += parseFloat(item.subtotal) || 0;
      if (item.category === 'packaging') packagingTotal += parseFloat(item.subtotal) || 0;
    });

    logger.info('\n=== 计算汇总 ===');
    logger.info('原料总计:', materialTotal);
    logger.info('工序总计:', processTotal);
    logger.info('包材总计:', packagingTotal);

    // 模拟计算
    const CostCalculator = require('../utils/costCalculator');
    const SystemConfig = require('../models/SystemConfig');

    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    logger.info('\n=== 系统配置 ===');
    logger.info('配置:', calculatorConfig);

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

    logger.info('\n=== 计算结果 ===');
    logger.info('计算结果:', JSON.stringify(calculation, null, 2));

    if (calculation.profitTiers) {
      logger.info('\n=== 利润区间 ===');
      calculation.profitTiers.forEach(tier => {
        logger.info(`${tier.profitPercentage}: ${tier.price} ${calculation.currency}`);
      });
    }

  } catch (err) {
    logger.error('检查失败:', err);
  } finally {
    await db.close();
  }
}

checkQuotation();
