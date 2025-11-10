/**
 * 系统配置数据模型
 */

const dbManager = require('../db/database');

class SystemConfig {
  /**
   * 获取所有配置
   * @returns {Array} 配置列表
   */
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM system_config ORDER BY config_key');
    return stmt.all();
  }

  /**
   * 根据配置键获取配置值
   * @param {string} key - 配置键
   * @returns {Object|null} 配置对象
   */
  static findByKey(key) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM system_config WHERE config_key = ?');
    return stmt.get(key);
  }

  /**
   * 获取配置值（解析 JSON）
   * @param {string} key - 配置键
   * @returns {any} 配置值
   */
  static getValue(key) {
    const config = this.findByKey(key);
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
   * @returns {boolean} 是否更新成功
   */
  static update(key, value) {
    const db = dbManager.getDatabase();
    
    // 如果值是对象或数组，转换为 JSON 字符串
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const stmt = db.prepare(`
      UPDATE system_config 
      SET config_value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE config_key = ?
    `);
    
    const result = stmt.run(configValue, key);
    return result.changes > 0;
  }

  /**
   * 批量更新配置
   * @param {Object} configs - 配置对象 { key: value }
   * @returns {number} 更新的配置数量
   */
  static batchUpdate(configs) {
    const db = dbManager.getDatabase();
    let updatedCount = 0;

    const updateStmt = db.prepare(`
      UPDATE system_config 
      SET config_value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE config_key = ?
    `);

    const transaction = db.transaction((configsObj) => {
      for (const [key, value] of Object.entries(configsObj)) {
        const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const result = updateStmt.run(configValue, key);
        if (result.changes > 0) {
          updatedCount++;
        }
      }
    });

    transaction(configs);
    return updatedCount;
  }

  /**
   * 创建新配置
   * @param {Object} config - 配置对象
   * @param {string} config.key - 配置键
   * @param {any} config.value - 配置值
   * @param {string} config.description - 配置描述
   * @returns {number} 新配置的 ID
   */
  static create({ key, value, description }) {
    const db = dbManager.getDatabase();
    
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const stmt = db.prepare(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(key, configValue, description);
    return result.lastInsertRowid;
  }

  /**
   * 删除配置
   * @param {string} key - 配置键
   * @returns {boolean} 是否删除成功
   */
  static delete(key) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM system_config WHERE config_key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  /**
   * 获取所有配置作为对象
   * @returns {Object} 配置对象
   */
  static getAllAsObject() {
    const configs = this.findAll();
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
   * @returns {Object} 计算器所需的配置参数
   */
  static getCalculatorConfig() {
    return {
      overheadRate: parseFloat(this.getValue('overhead_rate')) || 0.2,
      vatRate: parseFloat(this.getValue('vat_rate')) || 0.13,
      insuranceRate: parseFloat(this.getValue('insurance_rate')) || 0.003,
      exchangeRate: parseFloat(this.getValue('exchange_rate')) || 7.2,
      fobShenzhenExchangeRate: parseFloat(this.getValue('fob_shenzhen_exchange_rate')) || 7.1,
      profitTiers: this.getValue('profit_tiers') || [0.05, 0.10, 0.25, 0.50]
    };
  }
}

module.exports = SystemConfig;
