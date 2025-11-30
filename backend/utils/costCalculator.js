/**
 * 成本计算工具类
 * 实现核心的成本计算逻辑
 */

class CostCalculator {
  /**
   * 构造函数
   * @param {Object} config - 系统配置参数
   * @param {number} config.overheadRate - 管销率（默认 0.2）
   * @param {number} config.vatRate - 增值税率（默认 0.13）
   * @param {number} config.insuranceRate - 保险率（默认 0.003）
   * @param {number} config.exchangeRate - 汇率（默认 7.2）
   * @param {number} config.processCoefficient - 工价系数（默认 1.56）
   * @param {Array<number>} config.profitTiers - 利润区间（默认 [0.05, 0.10, 0.25, 0.50]）
   */
  constructor(config = {}) {
    this.overheadRate = config.overheadRate || 0.2;
    this.vatRate = config.vatRate || 0.13;
    this.insuranceRate = config.insuranceRate || 0.003;
    this.exchangeRate = config.exchangeRate || 7.2;
    this.processCoefficient = config.processCoefficient || 1.56;
    this.profitTiers = config.profitTiers || [0.05, 0.10, 0.25, 0.50];
  }

  /**
   * 计算基础成本价
   * 公式：成本价 = 原料总价 + 工价总价（系数倍数） + 包材总价 + 运费成本（可选）
   * 
   * @param {Object} params - 计算参数
   * @param {number} params.materialTotal - 原料总价
   * @param {number} params.processTotal - 工价总价（原始值，会自动乘以工价系数）
   * @param {number} params.packagingTotal - 包材总价
   * @param {number} params.freightCost - 运费成本（运费总价 ÷ 数量）
   * @param {boolean} params.includeFreight - 是否将运费计入基础成本价（默认true）
   * @param {number} params.afterOverheadMaterialTotal - 管销后算的原料总价（默认0）
   * @returns {number} 基础成本价
   */
  calculateBaseCost({ materialTotal, processTotal, packagingTotal, freightCost, includeFreight = true, afterOverheadMaterialTotal = 0 }) {
    // 工序总计需要乘以工价系数
    const adjustedProcessTotal = processTotal * this.processCoefficient;
    // 基础成本价不包含管销后算的原料
    let baseCost = materialTotal + adjustedProcessTotal + packagingTotal;
    if (includeFreight) {
      baseCost += freightCost;
    }
    return this._round(baseCost, 4);
  }

  /**
   * 计算管销价
   * 公式：管销价 = 成本价 ÷ (1 - 管销率)
   * 
   * @param {number} baseCost - 基础成本价
   * @returns {number} 管销价
   */
  calculateOverheadPrice(baseCost) {
    const overheadPrice = baseCost / (1 - this.overheadRate);
    return this._round(overheadPrice, 4);
  }

  /**
   * 计算内销价（含税）
   * 公式：内销价 = 管销价 × (1 + 增值税率)
   * 
   * @param {number} overheadPrice - 管销价
   * @returns {number} 内销价
   */
  calculateDomesticPrice(overheadPrice) {
    const domesticPrice = overheadPrice * (1 + this.vatRate);
    return this._round(domesticPrice, 4);
  }

  /**
   * 计算外销价（未税）
   * 公式：外销价 = 管销价 ÷ 汇率
   * 
   * @param {number} overheadPrice - 管销价
   * @returns {number} 外销价（美元）
   */
  calculateExportPrice(overheadPrice) {
    const exportPrice = overheadPrice / this.exchangeRate;
    return this._round(exportPrice, 4);
  }

  /**
   * 计算外销保险价
   * 公式：保险价 = 外销价 × (1 + 保险率)
   * 
   * @param {number} exportPrice - 外销价
   * @returns {number} 保险价
   */
  calculateInsurancePrice(exportPrice) {
    const insurancePrice = exportPrice * (1 + this.insuranceRate);
    return this._round(insurancePrice, 4);
  }

  /**
   * 生成利润区间报价
   * 公式：利润报价 = 基础价 × (1 + 利润%)
   * 
   * @param {number} basePrice - 基础价格（内销价或外销保险价）
   * @returns {Array<Object>} 利润区间报价数组
   */
  generateProfitTiers(basePrice) {
    return this.profitTiers.map(tier => ({
      profitRate: tier,
      profitPercentage: `${(tier * 100).toFixed(0)}%`,
      price: this._round(basePrice * (1 + tier), 4)
    }));
  }

  /**
   * 完整计算报价单
   * 
   * @param {Object} params - 计算参数
   * @param {number} params.materialTotal - 原料总价（不含管销后算的原料）
   * @param {number} params.processTotal - 工价总价
   * @param {number} params.packagingTotal - 包材总价
   * @param {number} params.freightTotal - 运费总价
   * @param {number} params.quantity - 购买数量
   * @param {string} params.salesType - 销售类型（'domestic' 或 'export'）
   * @param {boolean} params.includeFreightInBase - 是否将运费计入基础成本价（默认true）
   * @param {number} params.afterOverheadMaterialTotal - 管销后算的原料总价（默认0）
   * @returns {Object} 完整的报价计算结果
   */
  calculateQuotation(params) {
    const {
      materialTotal,
      processTotal,
      packagingTotal,
      freightTotal,
      quantity,
      salesType,
      includeFreightInBase = true,
      afterOverheadMaterialTotal = 0
    } = params;

    // 计算运费成本（每片）
    const freightCost = freightTotal / quantity;

    // 计算基础成本价（不含管销后算的原料）
    const baseCost = this.calculateBaseCost({
      materialTotal,
      processTotal,
      packagingTotal,
      freightCost,
      includeFreight: includeFreightInBase,
      afterOverheadMaterialTotal
    });

    // 计算管销价
    const overheadPrice = this.calculateOverheadPrice(baseCost);

    let result = {
      baseCost,
      overheadPrice,
      freightCost,
      salesType,
      includeFreightInBase,
      afterOverheadMaterialTotal
    };

    // 根据销售类型计算最终价格
    if (salesType === 'domestic') {
      // 内销
      let domesticPrice;
      if (includeFreightInBase) {
        // 运费已计入基础成本价
        // 公式：管销价 × (1 + 增值税率) + 管销后算的原料
        domesticPrice = this.calculateDomesticPrice(overheadPrice) + afterOverheadMaterialTotal;
        domesticPrice = this._round(domesticPrice, 4);
      } else {
        // 运费未计入基础成本价，需要在管销价基础上加运费再计算含税价
        // 公式：(管销价 + 运费) × (1 + 增值税率) + 管销后算的原料
        domesticPrice = (overheadPrice + freightCost) * (1 + this.vatRate) + afterOverheadMaterialTotal;
        domesticPrice = this._round(domesticPrice, 4);
      }
      const profitTiers = this.generateProfitTiers(domesticPrice);

      result = {
        ...result,
        domesticPrice,
        profitTiers,
        currency: 'CNY'
      };
    } else if (salesType === 'export') {
      // 外销
      let exportPrice, insurancePrice;
      if (includeFreightInBase) {
        // 运费已计入基础成本价
        // 公式：管销价 ÷ 汇率 + 管销后算的原料
        exportPrice = this.calculateExportPrice(overheadPrice) + afterOverheadMaterialTotal;
        exportPrice = this._round(exportPrice, 4);
        insurancePrice = this.calculateInsurancePrice(exportPrice);
      } else {
        // 运费未计入基础成本价，需要在管销价基础上加运费再计算
        // 公式：(管销价 + 运费) ÷ 汇率 + 管销后算的原料
        exportPrice = (overheadPrice + freightCost) / this.exchangeRate + afterOverheadMaterialTotal;
        exportPrice = this._round(exportPrice, 4);
        insurancePrice = this.calculateInsurancePrice(exportPrice);
      }
      // 外销的最终成本价是保险价（管销价/汇率×1.003）
      // 利润区间基于保险价计算
      const profitTiers = this.generateProfitTiers(insurancePrice);

      result = {
        ...result,
        exportPrice,
        insurancePrice,
        profitTiers,
        currency: 'USD',
        exchangeRate: this.exchangeRate
      };
    }

    return result;
  }

  /**
   * 数值四舍五入
   * @private
   * @param {number} value - 要四舍五入的值
   * @param {number} decimals - 保留的小数位数
   * @returns {number} 四舍五入后的值
   */
  _round(value, decimals = 4) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

module.exports = CostCalculator;
