/**
 * 检查报价单详情API返回的数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
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
      console.log('报价单不存在:', quotationNo);
      return;
    }
    
    const quotation = result.rows[0];
    console.log('\n=== 报价单基本信息 ===');
    console.log('ID:', quotation.id);
    console.log('最终价格 (final_price):', quotation.final_price);
    
    // 模拟 getQuotationDetail 的逻辑
    const items = await QuotationItem.getGroupedByCategory(quotation.id);
    
    console.log('\n=== items.process ===');
    console.log('total:', items.process.total, typeof items.process.total);
    console.log('items count:', items.process.items.length);
    
    // 计算原料总计
    const materialTotal = items.material.items
      .filter(item => !item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    
    const afterOverheadMaterialTotal = items.material.items
      .filter(item => item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    
    console.log('\n=== 计算参数 ===');
    console.log('materialTotal:', materialTotal);
    console.log('processTotal:', parseFloat(items.process.total || 0));
    console.log('packagingTotal:', parseFloat(items.packaging.total || 0));
    console.log('freightTotal:', parseFloat(quotation.freight_total || 0));
    console.log('quantity:', parseFloat(quotation.quantity || 1));
    
    // 获取系统配置
    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    console.log('\n=== 系统配置 ===');
    console.log('processCoefficient:', calculatorConfig.processCoefficient);
    
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
    
    console.log('\n=== 计算结果 ===');
    console.log('baseCost:', calculation.baseCost);
    console.log('overheadPrice:', calculation.overheadPrice);
    console.log('domesticPrice:', calculation.domesticPrice);
    console.log('profitTiers[0] (5%):', calculation.profitTiers[0]);
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    await db.close();
  }
}

checkApiDetail();
