/**
 * 系统配置数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class SystemConfig {
  /**
   * 获取所有配置
   * @returns {Promise<Array>} 配置列表
   */
  static async findAll() {
    const result = await dbManager.query(
      'SELECT * FROM system_config ORDER BY config_key'
    );
    return result.rows;
  }

  /**
   * 根据配置键获取配置值
   * @param {string} key - 配置键
   * @returns {Promise<Object|null>} 配置对象或 null
   */
  static async findByKey(key) {
    const result = await dbManager.query(
      'SELECT * FROM system_config WHERE config_key = $1',
      [key]
    );
    return result.rows[0] || null;
  }

  /**
   * 获取配置值（解析 JSON）
   * @param {string} key - 配置键
   * @returns {Promise<any>} 配置值
   */
  static async getValue(key) {
    const config = await this.findByKey(key);
    if (!config) return null;

    // 尝试解析 JSON
    try {
      return JSON.parse(config.config_value);
    } catch (e) {
      // 如果不是 JSON，返回原始字符串
      return config.config_value;
    }
  }

  /**
   * 更新配置值
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(key, value) {
    // 如果值是对象或数组，转换为 JSON 字符串
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const result = await dbManager.query(
      `UPDATE system_config 
       SET config_value = $1, updated_at = NOW() 
       WHERE config_key = $2`,
      [configValue, key]
    );
    
    return result.rowCount > 0;
  }

  /**
   * 批量更新配置（存在则更新，不存在则插入）
   * 使用 PostgreSQL 的 ON CONFLICT DO UPDATE 语法
   * @param {Object} configs - 配置对象 { key: value }
   * @returns {Promise<number>} 更新的配置数量
   */
  static async batchUpdate(configs) {
    return await dbManager.transaction(async (client) => {
      let updatedCount = 0;

      for (const [key, value] of Object.entries(configs)) {
        const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        // 使用 UPSERT 语法：ON CONFLICT DO UPDATE
        const result = await client.query(
          `INSERT INTO system_config (config_key, config_value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (config_key) 
           DO UPDATE SET config_value = $2, updated_at = NOW()`,
          [key, configValue]
        );
        
        if (result.rowCount > 0) updatedCount++;
      }

      return updatedCount;
    });
  }

  /**
   * 创建新配置
   * @param {Object} config - 配置对象
   * @param {string} config.key - 配置键
   * @param {any} config.value - 配置值
   * @param {string} config.description - 配置描述
   * @returns {Promise<number>} 新配置的 ID
   */
  static async create({ key, value, description }) {
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const result = await dbManager.query(
      `INSERT INTO system_config (config_key, config_value, description)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [key, configValue, description]
    );
    
    return result.rows[0].id;
  }

  /**
   * 删除配置
   * @param {string} key - 配置键
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(key) {
    const result = await dbManager.query(
      'DELETE FROM system_config WHERE config_key = $1',
      [key]
    );
    return result.rowCount > 0;
  }

  /**
   * 获取所有配置作为对象
   * @returns {Promise<Object>} 配置对象
   */
  static async getAllAsObject() {
    const configs = await this.findAll();
    const result = {};

    configs.forEach(config => {
      try {
        result[config.config_key] = JSON.parse(config.config_value);
      } catch (e) {
        result[config.config_key] = config.config_value;
      }
    });

    return result;
  }

  /**
   * 获取计算器配置
   * @returns {Promise<Object>} 计算器所需的配置参数
   */
  static async getCalculatorConfig() {
    // 一次性获取所有配置，避免多次数据库查询
    const allConfigs = await this.getAllAsObject();
    
    return {
      overheadRate: parseFloat(allConfigs['overhead_rate']) || 0.2,
      vatRate: parseFloat(allConfigs['vat_rate']) || 0.13,
      vatRateOptions: allConfigs['vat_rate_options'] || [0.13, 0.10],
      insuranceRate: parseFloat(allConfigs['insurance_rate']) || 0.003,
      exchangeRate: parseFloat(allConfigs['exchange_rate']) || 7.2,
      processCoefficient: parseFloat(allConfigs['process_coefficient']) || 1.56,
      fobShenzhenExchangeRate: parseFloat(allConfigs['fob_shenzhen_exchange_rate']) || 7.1,
      fcl20FreightUsd: parseFloat(allConfigs['fcl_20_freight_usd']) || 840,
      fcl40FreightUsd: parseFloat(allConfigs['fcl_40_freight_usd']) || 940,
      lclBaseFreight1_3: parseFloat(allConfigs['lcl_base_freight_1_3']) || 800,
      lclBaseFreight4_10: parseFloat(allConfigs['lcl_base_freight_4_10']) || 1000,
      lclBaseFreight11_15: parseFloat(allConfigs['lcl_base_freight_11_15']) || 1500,
      lclHandlingCharge: parseFloat(allConfigs['lcl_handling_charge']) || 500,
      lclCfsPerCbm: parseFloat(allConfigs['lcl_cfs_per_cbm']) || 170,
      lclDocumentFee: parseFloat(allConfigs['lcl_document_fee']) || 500,
      profitTiers: allConfigs['profit_tiers'] || [0.05, 0.10, 0.25, 0.50],
      materialCoefficients: allConfigs['material_coefficients'] || {}
    };
  }
}

module.exports = SystemConfig;
