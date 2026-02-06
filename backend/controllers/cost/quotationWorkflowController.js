/**
 * 报价单工作流控制器
 * 处理报价单提交、计算等工作流操作
 * 代码完整来自 costController.js，未做任何修改
 */

const Quotation = require('../../models/Quotation');
const SystemConfig = require('../../models/SystemConfig');
const CostCalculator = require('../../utils/costCalculator');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');

// 引用公共工具函数
const { calculateItemTotals, getModelCostParams, processVatRate } = require('./utils/quotationHelper');

/**
 * 提交报价单
 * POST /api/cost/quotations/:id/submit
 */
const submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查报价单是否存在
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json(error('报价单不存在', 404));
    }

    // 检查权限：管理员和审核员不允许提交报价单
    if (['admin', 'reviewer'].includes(req.user.role)) {
      return res.status(403).json(error('管理员和审核员无权提交报价单', 403));
    }

    if (quotation.created_by !== req.user.id) {
      return res.status(403).json(error('无权限提交此报价单', 403));
    }

    // 检查状态：只有草稿和已退回状态可以提交
    if (!['draft', 'rejected'].includes(quotation.status)) {
      return res.status(400).json(error('当前状态不允许提交', 400));
    }

    // 更新状态为已提交
    await Quotation.updateStatus(id, 'submitted');

    // 查询更新后的报价单
    const updatedQuotation = await Quotation.findById(id);

    res.json(success(updatedQuotation, '报价单提交成功'));

  } catch (err) {
    logger.error('提交报价单失败:', err.message);
    res.status(500).json(error('提交报价单失败: ' + err.message, 500));
  }
};

/**
 * 计算报价（不保存）
 * POST /api/cost/calculate
 */
const calculateQuotation = async (req, res) => {
  try {
    const {
      quantity,
      freight_total,
      sales_type,
      items,
      model_id
    } = req.body;

    // 数据验证
    if (!quantity || !sales_type || !items) {
      return res.status(400).json(error('缺少必填字段', 400));
    }

    // 获取原料系数和分类
    const { coefficient: materialCoefficient, category: modelCategory } = await getModelCostParams(model_id);

    // 计算明细总计
    const { materialTotal, afterOverheadMaterialTotal, processTotal, packagingTotal } = calculateItemTotals(items, materialCoefficient, modelCategory);

    // 获取系统配置并计算报价
    const calculatorConfig = await SystemConfig.getCalculatorConfig();

    // 验证增值税率（计算接口不返回错误，仅静默忽略无效值）
    processVatRate(req.body.vat_rate, calculatorConfig);

    const calculator = new CostCalculator(calculatorConfig);

    // 处理自定义费用
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

    // 返回结果中包含原料系数信息和实际使用的增值税率
    calculation.materialCoefficient = materialCoefficient;
    calculation.vatRate = calculatorConfig.vatRate;

    res.json(success(calculation, '计算成功'));

  } catch (err) {
    logger.error('计算报价失败:', err.message);
    res.status(500).json(error('计算报价失败: ' + err.message, 500));
  }
};

module.exports = {
  submitQuotation,
  calculateQuotation
};
