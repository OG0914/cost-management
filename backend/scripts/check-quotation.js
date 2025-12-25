/**
 * 检查报价单数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
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
      console.log('报价单不存在:', quotationNo);
      return;
    }
    
    const quotation = result.rows[0];
    console.log('\n=== 报价单基本信息 ===');
    console.log('ID:', quotation.id);
    console.log('编号:', quotation.quotation_no);
    console.log('数量 (quantity):', quotation.quantity, typeof quotation.quantity);
    console.log('运费总价 (freight_total):', quotation.freight_total, typeof quotation.freight_total);
    console.log('销售类型:', quotation.sales_type);
    console.log('基础成本:', quotation.base_cost);
    console.log('管销价:', quotation.overhead_price);
    console.log('最终价格:', quotation.final_price);
    console.log('币别:', quotation.currency);
    
    // 查询明细
    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1',
      [quotation.id]
    );
    
    console.log('\n=== 报价单明细 ===');
    console.log('明细数量:', itemsResult.rows.length);
    
    let materialTotal = 0;
    let processTotal = 0;
    let packagingTotal = 0;
    
    itemsResult.rows.forEach(item => {
      console.log(`- ${item.category}: ${item.item_name}, 小计: ${item.subtotal}`);
      if (item.category === 'material') materialTotal += parseFloat(item.subtotal) || 0;
      if (item.category === 'process') processTotal += parseFloat(item.subtotal) || 0;
      if (item.category === 'packaging') packagingTotal += parseFloat(item.subtotal) || 0;
    });
    
    console.log('\n=== 计算汇总 ===');
    console.log('原料总计:', materialTotal);
    console.log('工序总计:', processTotal);
    console.log('包材总计:', packagingTotal);
    
    // 模拟计算
    const CostCalculator = require('../utils/costCalculator');
    const SystemConfig = require('../models/SystemConfig');
    
    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    console.log('\n=== 系统配置 ===');
    console.log('配置:', calculatorConfig);
    
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
    console.log('计算结果:', JSON.stringify(calculation, null, 2));
    
    if (calculation.profitTiers) {
      console.log('\n=== 利润区间 ===');
      calculation.profitTiers.forEach(tier => {
        console.log(`${tier.profitPercentage}: ${tier.price} ${calculation.currency}`);
      });
    }
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    await db.close();
  }
}

checkQuotation();
