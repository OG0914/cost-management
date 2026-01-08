/**
 * 报价单工作流控制器
 * 处理报价单提交、计算等工作流操作
 */

const Quotation = require('../../models/Quotation');
const SystemConfig = require('../../models/SystemConfig');
const Model = require('../../models/Model');
const CostCalculator = require('../../utils/costCalculator');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * 提交报价单
 */
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) return res.status(404).json(error('报价单不存在', 404));

    if (quotation.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(error('无权限提交此报价单', 403));
    }

    if (!['draft', 'rejected'].includes(quotation.status)) {
      return res.status(400).json(error('当前状态不允许提交', 400));
    }

    await Quotation.updateStatus(id, 'submitted');
    const updatedQuotation = await Quotation.findById(id);

    res.json(success(updatedQuotation, '报价单提交成功'));
  } catch (err) {
    logger.error('提交报价单失败:', err);
    res.status(500).json(error('提交报价单失败: ' + err.message, 500));
  }
};

/**
 * 计算报价（不保存）
 */
exports.calculateQuotation = async (req, res) => {
  try {
    const { quantity, freight_total, sales_type, items, model_id } = req.body;

    if (!quantity || !sales_type || !items) {
      return res.status(400).json(error('缺少必填字段', 400));
    }

    // 获取原料系数
    let materialCoefficient = 1;
    if (model_id) {
      const model = await Model.findById(model_id);
      if (model && model.model_category) {
        const coefficients = await SystemConfig.getValue('material_coefficients') || {};
        materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
      }
    }

    // 计算明细总计
    const materialTotal = items
      .filter(item => item.category === 'material' && !item.after_overhead)
      .reduce((sum, item) => {
        if (item.coefficient_applied) return sum + parseFloat(item.subtotal || 0);
        return sum + CostCalculator.calculateMaterialSubtotal(
          parseFloat(item.usage_amount || 0),
          parseFloat(item.unit_price || 0),
          materialCoefficient
        );
      }, 0);

    const afterOverheadMaterialTotal = items
      .filter(item => item.category === 'material' && item.after_overhead)
      .reduce((sum, item) => {
        if (item.coefficient_applied) return sum + parseFloat(item.subtotal || 0);
        return sum + CostCalculator.calculateMaterialSubtotal(
          parseFloat(item.usage_amount || 0),
          parseFloat(item.unit_price || 0),
          materialCoefficient
        );
      }, 0);

    const processTotal = items
      .filter(item => item.category === 'process')
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    const packagingTotal = items
      .filter(item => item.category === 'packaging')
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    // 获取系统配置
    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
      const vatRate = parseFloat(req.body.vat_rate);
      if (!isNaN(vatRate) && vatRate >= 0 && vatRate <= 1) {
        calculatorConfig.vatRate = vatRate;
      }
    }

    const calculator = new CostCalculator(calculatorConfig);
    const customFees = req.body.custom_fees || [];

    const calculation = calculator.calculateQuotation({
      materialTotal,
      processTotal,
      packagingTotal,
      freightTotal: parseFloat(freight_total || 0),
      quantity: parseFloat(quantity || 1),
      salesType: sales_type,
      includeFreightInBase: req.body.include_freight_in_base !== false,
      afterOverheadMaterialTotal,
      customFees
    });

    calculation.materialCoefficient = materialCoefficient;
    calculation.vatRate = calculatorConfig.vatRate;

    res.json(success(calculation, '计算成功'));
  } catch (err) {
    logger.error('计算报价失败:', err);
    res.status(500).json(error('计算报价失败: ' + err.message, 500));
  }
};
