/**
 * 报价单 CRUD 控制器
 * 处理报价单的创建、更新、删除、列表、详情
 */

const Quotation = require('../../models/Quotation');
const QuotationItem = require('../../models/QuotationItem');
const QuotationCustomFee = require('../../models/QuotationCustomFee');
const SystemConfig = require('../../models/SystemConfig');
const Model = require('../../models/Model');
const CostCalculator = require('../../utils/costCalculator');
const { success, error, paginated } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * 计算明细总计的公共函数
 */
const calculateTotals = (items, materialCoefficient) => {
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

  return { materialTotal, afterOverheadMaterialTotal, processTotal, packagingTotal };
};

/**
 * 获取原料系数
 */
const getMaterialCoefficient = async (modelId) => {
  let coefficient = 1;
  if (modelId) {
    const model = await Model.findById(modelId);
    if (model && model.model_category) {
      const coefficients = await SystemConfig.getValue('material_coefficients') || {};
      coefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
    }
  }
  return coefficient;
};

/**
 * 创建报价单
 */
exports.createQuotation = async (req, res) => {
  try {
    const {
      customer_name, customer_region, model_id, regulation_id,
      quantity, freight_total, sales_type, shipping_method, port, items
    } = req.body;

    if (!customer_name || !customer_region || !model_id || !regulation_id || !quantity || !sales_type) {
      return res.status(400).json(error('缺少必填字段', 400));
    }
    if (!['domestic', 'export'].includes(sales_type)) {
      return res.status(400).json(error('销售类型必须是 domestic 或 export', 400));
    }
    if (quantity <= 0) {
      return res.status(400).json(error('数量必须大于0', 400));
    }

    const materialCoefficient = await getMaterialCoefficient(model_id);
    const freight_per_unit = freight_total / quantity;
    const totals = calculateTotals(items || [], materialCoefficient);

    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    let vatRateToSave = null;
    if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
      const vatRate = parseFloat(req.body.vat_rate);
      if (isNaN(vatRate) || vatRate < 0 || vatRate > 1) {
        return res.status(400).json(error('增值税率必须在 0 到 1 之间', 400));
      }
      calculatorConfig.vatRate = vatRate;
      vatRateToSave = vatRate;
    }

    const calculator = new CostCalculator(calculatorConfig);
    const customFees = req.body.custom_fees || [];

    const calculation = calculator.calculateQuotation({
      materialTotal: totals.materialTotal,
      processTotal: totals.processTotal,
      packagingTotal: totals.packagingTotal,
      freightTotal: parseFloat(freight_total || 0),
      quantity: parseFloat(quantity || 1),
      salesType: sales_type,
      includeFreightInBase: req.body.include_freight_in_base !== false,
      afterOverheadMaterialTotal: totals.afterOverheadMaterialTotal,
      customFees
    });
    calculation.vatRate = calculatorConfig.vatRate;

    const quotation_no = await Quotation.generateQuotationNo();
    const final_price = sales_type === 'domestic' ? calculation.domesticPrice : calculation.insurancePrice;

    let customProfitTiersJson = null;
    if (req.body.custom_profit_tiers && Array.isArray(req.body.custom_profit_tiers) && req.body.custom_profit_tiers.length > 0) {
      customProfitTiersJson = JSON.stringify(req.body.custom_profit_tiers);
    }

    const quotationId = await Quotation.create({
      quotation_no, customer_name, customer_region, model_id, regulation_id,
      packaging_config_id: req.body.packaging_config_id || null,
      quantity, freight_total, freight_per_unit, sales_type,
      shipping_method: shipping_method || null, port: port || null,
      base_cost: calculation.baseCost, overhead_price: calculation.overheadPrice,
      final_price, currency: calculation.currency,
      include_freight_in_base: req.body.include_freight_in_base !== false,
      custom_profit_tiers: customProfitTiersJson, vat_rate: vatRateToSave,
      status: 'draft', created_by: req.user.id
    });

    if (items && items.length > 0) {
      const itemsWithQuotationId = items.map(item => ({ ...item, quotation_id: quotationId }));
      await QuotationItem.batchCreate(itemsWithQuotationId);
    }
    if (customFees && customFees.length > 0) {
      await QuotationCustomFee.replaceByQuotationId(quotationId, customFees);
    }

    const quotation = await Quotation.findById(quotationId);
    res.status(201).json(success({ quotation, calculation }, '报价单创建成功'));
  } catch (err) {
    logger.error('创建报价单失败:', err);
    res.status(500).json(error('创建报价单失败: ' + err.message, 500));
  }
};

/**
 * 更新报价单
 */
exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name, customer_region, quantity, freight_total,
      sales_type, shipping_method, port, items
    } = req.body;

    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json(error('报价单不存在', 404));

    if (quotation.created_by !== req.user.id && !['admin', 'reviewer'].includes(req.user.role)) {
      return res.status(403).json(error('无权限编辑此报价单', 403));
    }
    if (!['draft', 'rejected'].includes(quotation.status)) {
      return res.status(400).json(error('当前状态不允许编辑', 400));
    }

    const materialCoefficient = await getMaterialCoefficient(quotation.model_id);
    const freight_per_unit = freight_total / quantity;
    const totals = calculateTotals(items || [], materialCoefficient);

    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    let vatRateToSave = null;
    if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
      const vatRate = parseFloat(req.body.vat_rate);
      if (isNaN(vatRate) || vatRate < 0 || vatRate > 1) {
        return res.status(400).json(error('增值税率必须在 0 到 1 之间', 400));
      }
      calculatorConfig.vatRate = vatRate;
      vatRateToSave = vatRate;
    }

    const calculator = new CostCalculator(calculatorConfig);
    const customFees = req.body.custom_fees || [];

    const calculation = calculator.calculateQuotation({
      materialTotal: totals.materialTotal,
      processTotal: totals.processTotal,
      packagingTotal: totals.packagingTotal,
      freightTotal: parseFloat(freight_total || 0),
      quantity: parseFloat(quantity || 1),
      salesType: sales_type,
      includeFreightInBase: req.body.include_freight_in_base !== false,
      afterOverheadMaterialTotal: totals.afterOverheadMaterialTotal,
      customFees
    });
    calculation.vatRate = calculatorConfig.vatRate;

    const final_price = sales_type === 'domestic' ? calculation.domesticPrice : calculation.insurancePrice;
    if (!final_price) {
      logger.error('最终价格计算失败:', { sales_type, calculation });
      return res.status(500).json(error('价格计算失败', 500));
    }

    let customProfitTiersJson = null;
    if (req.body.custom_profit_tiers && Array.isArray(req.body.custom_profit_tiers) && req.body.custom_profit_tiers.length > 0) {
      customProfitTiersJson = JSON.stringify(req.body.custom_profit_tiers);
    }

    await Quotation.update(id, {
      customer_name, customer_region, quantity, freight_total, freight_per_unit,
      sales_type, shipping_method: shipping_method || null, port: port || null,
      base_cost: calculation.baseCost, overhead_price: calculation.overheadPrice,
      final_price, currency: calculation.currency,
      packaging_config_id: req.body.packaging_config_id || null,
      include_freight_in_base: req.body.include_freight_in_base !== false ? 1 : 0,
      custom_profit_tiers: customProfitTiersJson, vat_rate: vatRateToSave
    });

    await QuotationItem.deleteByQuotationId(id);
    if (items && items.length > 0) {
      const itemsWithQuotationId = items.map(item => ({ ...item, quotation_id: id }));
      await QuotationItem.batchCreate(itemsWithQuotationId);
    }
    await QuotationCustomFee.replaceByQuotationId(id, customFees);

    const updatedQuotation = await Quotation.findById(id);
    res.json(success({ quotation: updatedQuotation, calculation }, '报价单更新成功'));
  } catch (err) {
    logger.error('更新报价单失败:', err);
    res.status(500).json(error('更新报价单失败: ' + err.message, 500));
  }
};

/**
 * 删除报价单
 */
exports.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json(error('报价单不存在', 404));

    if (req.user.role === 'admin') {
      const result = await Quotation.delete(id);
      return result ? res.json(success(null, '报价单删除成功')) : res.status(500).json(error('删除报价单失败', 500));
    }

    if (quotation.created_by !== req.user.id) {
      return res.status(403).json(error('无权限删除此报价单', 403));
    }
    if (quotation.status !== 'draft') {
      return res.status(400).json(error('只有草稿状态的报价单可以删除', 400));
    }

    const result = await Quotation.delete(id);
    result ? res.json(success(null, '报价单删除成功')) : res.status(500).json(error('删除报价单失败', 500));
  } catch (err) {
    logger.error('删除报价单失败:', err);
    res.status(500).json(error('删除报价单失败: ' + err.message, 500));
  }
};

/**
 * 获取报价单列表
 */
exports.getQuotationList = async (req, res) => {
  try {
    const { status, keyword, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    const options = {
      status, keyword,
      date_from: start_date, date_to: end_date,
      page: pageNum, pageSize: pageSizeNum
    };

    if (!['admin', 'reviewer', 'readonly'].includes(req.user.role)) {
      options.created_by = req.user.id;
    }

    const result = await Quotation.findAll(options);
    res.json(paginated(result.data, result.total, result.page, result.pageSize));
  } catch (err) {
    logger.error('获取报价单列表失败:', err);
    res.status(500).json(error('获取报价单列表失败: ' + err.message, 500));
  }
};

/**
 * 获取报价单详情
 */
exports.getQuotationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json(error('报价单不存在', 404));

    const StandardCost = require('../../models/StandardCost');
    const isStandardCost = await StandardCost.findByQuotationId(quotation.id);

    if (
      quotation.created_by !== req.user.id &&
      !['admin', 'reviewer', 'readonly'].includes(req.user.role) &&
      !isStandardCost
    ) {
      return res.status(403).json(error('无权限查看此报价单', 403));
    }

    const items = await QuotationItem.getGroupedByCategory(id);
    const materialCoefficient = await getMaterialCoefficient(quotation.model_id);

    const calculatorConfig = await SystemConfig.getCalculatorConfig();
    if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
      calculatorConfig.vatRate = parseFloat(quotation.vat_rate);
    }

    const calculator = new CostCalculator(calculatorConfig);

    const materialTotal = items.material.items
      .filter(item => !item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    const afterOverheadMaterialTotal = items.material.items
      .filter(item => item.after_overhead)
      .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    const customFeesFromDb = await QuotationCustomFee.findByQuotationId(id);
    const customFees = customFeesFromDb.map(fee => ({
      name: fee.fee_name, rate: fee.fee_rate, sortOrder: fee.sort_order
    }));

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

    calculation.materialCoefficient = materialCoefficient;
    calculation.vatRate = calculatorConfig.vatRate;
    items.process.displayTotal = items.process.total;

    res.json(success({ quotation, items, calculation, customFees }, '获取报价单详情成功'));
  } catch (err) {
    logger.error('获取报价单详情失败:', err);
    res.status(500).json(error('获取报价单详情失败: ' + err.message, 500));
  }
};
