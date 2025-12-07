/**
 * 检查 API 响应数据
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db/database');
const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const SystemConfig = require('../models/SystemConfig');
const Model = require('../models/Model');
const CostCalculator = require('../utils/costCalculator');

async function checkApiResponse() {
  try {
    await db.initialize();
    
    // 查询报价单
    const quotationNo = 'MK20251207-002';
    const pool = db.getPool();
    const result = await pool.query(
      'SELECT id FROM quotations WHERE quotation_no = $1',
      [quotationNo]
    );
    
    if (result.rows.length === 0) {
      console.log('报价单不存在');
      return;
    }
    
    const quotationId = result.rows[0].id;
    
    // 模拟 getQuotationDetail 的逻辑
    const quotation = await Quotation.findById(quotationId);
    const items = await QuotationItem.getGroupedByCategory(quotationId);
    
    // 获取原料系数
    let materialCoefficient = 1;
    const model = await Model.findById(quotation.model_id);
    if (model && model.model_category) {
      const coefficients = await SystemConfig.getValue('material_coefficients') || {};
      materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
    }
    
    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    
    if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
      calculatorConfig.vatRate = quotation.vat_rate;
    }
    
    const calculator = new CostCalculator(calculatorConfig);
    
    // 计算原料总计
    const materialTotal = items.material.items
      .filter(item => !item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    
    const afterOverheadMaterialTotal = items.material.items
      .filter(item => item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    
    const calculation = calculator.calculateQuotation({
      materialTotal,
      processTotal: items.process.total,
      packagingTotal: items.packaging.total,
      freightTotal: parseFloat(quotation.freight_total) || 0,
      quantity: parseFloat(quotation.quantity) || 1,
      salesType: quotation.sales_type,
      includeFreightInBase: quotation.include_freight_in_base !== false,
      afterOverheadMaterialTotal
    });
    
    calculation.materialCoefficient = materialCoefficient;
    calculation.vatRate = calculatorConfig.vatRate;
    
    // 模拟 API 响应
    const response = {
      quotation,
      items,
      calculation
    };
    
    console.log('\n=== 模拟 API 响应 (JSON) ===');
    const jsonResponse = JSON.stringify(response, null, 2);
    console.log(jsonResponse);
    
    // 解析 JSON 后检查
    const parsed = JSON.parse(jsonResponse);
    console.log('\n=== 解析后的 profitTiers ===');
    if (parsed.calculation && parsed.calculation.profitTiers) {
      parsed.calculation.profitTiers.forEach((tier, index) => {
        console.log(`Tier ${index}:`, tier);
        console.log(`  price type: ${typeof tier.price}`);
        console.log(`  price value: ${tier.price}`);
      });
    }
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    await db.close();
  }
}

checkApiResponse();
