/**
 * 报价单相关公共工具函数
 * 提取自 costController.js，供各子控制器复用
 */

const Model = require('../../../models/Model');
const SystemConfig = require('../../../models/SystemConfig');
const CostCalculator = require('../../../utils/costCalculator');

/**
 * 验证报价单公共字段
 * @param {Object} data - 请求数据
 * @returns {string|null} 错误消息，无错误返回 null
 */
const validateQuotationData = (data) => {
    const { sales_type, freight_total, items } = data;
    if (sales_type === 'export' && (freight_total === undefined || freight_total === null || freight_total < 0)) {
        return '外销报价必须填写运费';
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return '请至少添加一项成本明细';
    }
    return null;
};

/**
 * 计算原料明细总计（提取公共逻辑）
 * @param {Array} items - 明细数组
 * @param {number} materialCoefficient - 原料系数
 * @param {string} modelCategory - 产品分类
 * @returns {Object} { materialTotal, afterOverheadMaterialTotal, processTotal, packagingTotal }
 */
const calculateItemTotals = (items, materialCoefficient, modelCategory) => {
    // 计算单项原料小计的辅助函数
    const calcMaterialSubtotal = (item) => {
        if (item.coefficient_applied) {
            return parseFloat(item.subtotal || 0);
        }
        return CostCalculator.calculateMaterialSubtotal(
            parseFloat(item.usage_amount || 0),
            parseFloat(item.unit_price || 0),
            materialCoefficient,
            modelCategory
        );
    };

    // 原料总计：不包含管销后算的原料
    const materialTotal = items
        .filter(item => item.category === 'material' && !item.after_overhead)
        .reduce((sum, item) => sum + calcMaterialSubtotal(item), 0);

    // 管销后算的原料总计
    const afterOverheadMaterialTotal = items
        .filter(item => item.category === 'material' && item.after_overhead)
        .reduce((sum, item) => sum + calcMaterialSubtotal(item), 0);

    // 工序和包材直接累加subtotal
    const processTotal = items
        .filter(item => item.category === 'process')
        .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    const packagingTotal = items
        .filter(item => item.category === 'packaging')
        .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    return { materialTotal, afterOverheadMaterialTotal, processTotal, packagingTotal };
};

/**
 * 获取原料系数和分类
 * @param {number} modelId - 型号ID
 * @returns {Promise<{coefficient: number, category: string}>} 原料系数和分类
 */
const getModelCostParams = async (modelId) => {
    if (!modelId) return { coefficient: 1, category: '' };
    const model = await Model.findById(modelId);
    if (model && model.model_category) {
        const coefficients = await SystemConfig.getValue('material_coefficients') || {};
        return {
            coefficient: CostCalculator.getMaterialCoefficient(model.model_category, coefficients),
            category: model.model_category
        };
    }
    return { coefficient: 1, category: '' };
};

/**
 * 验证并获取增值税率
 * @param {number|undefined} vatRate - 请求中的增值税率
 * @param {Object} calculatorConfig - 计算器配置
 * @returns {{ valid: boolean, error?: string, vatRateToSave?: number }}
 */
const processVatRate = (vatRate, calculatorConfig) => {
    if (vatRate === undefined || vatRate === null) {
        return { valid: true, vatRateToSave: null };
    }
    const parsed = parseFloat(vatRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
        return { valid: false, error: '增值税率必须在 0 到 1 之间' };
    }
    calculatorConfig.vatRate = parsed;
    return { valid: true, vatRateToSave: parsed };
};

module.exports = {
    validateQuotationData,
    calculateItemTotals,
    getModelCostParams,
    processVatRate
};
