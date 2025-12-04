/**
 * 标准成本数据模型
 * 管理标准成本的创建、查询、版本控制等操作
 */

const dbManager = require('../db/database');

class StandardCost {
  /**
   * 获取所有当前版本的标准成本
   * @param {Object} options - 查询选项
   * @param {string} options.model_category - 型号分类过滤
   * @param {string} options.model_name - 型号名称过滤
   * @returns {Array} 标准成本列表
   */
  static findAllCurrent(options = {}) {
    const db = dbManager.getDatabase();
    
    let sql = `
      SELECT 
        sc.*,
        pc.config_name as packaging_config_name,
        pc.pc_per_bag,
        pc.bags_per_box,
        pc.boxes_per_carton,
        m.model_name,
        m.model_category,
        r.name as regulation_name,
        u.real_name as setter_name
      FROM standard_costs sc
      JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
      JOIN models m ON pc.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      JOIN users u ON sc.set_by = u.id
      WHERE sc.is_current = 1
    `;
    
    const params = [];
    
    if (options.model_category) {
      sql += ' AND m.model_category = ?';
      params.push(options.model_category);
    }
    
    if (options.model_name) {
      sql += ' AND m.model_name LIKE ?';
      params.push(`%${options.model_name}%`);
    }
    
    sql += ' ORDER BY sc.created_at DESC';
    
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * 根据ID查找标准成本
   * @param {number} id - 标准成本ID
   * @returns {Object|null} 标准成本对象
   */
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        sc.*,
        pc.config_name as packaging_config_name,
        pc.pc_per_bag,
        pc.bags_per_box,
        pc.boxes_per_carton,
        pc.model_id,
        m.model_name,
        m.model_category,
        m.regulation_id,
        r.name as regulation_name,
        u.real_name as setter_name
      FROM standard_costs sc
      JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
      JOIN models m ON pc.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      JOIN users u ON sc.set_by = u.id
      WHERE sc.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * 根据包装配置ID查找当前标准成本
   * @param {number} packagingConfigId - 包装配置ID
   * @returns {Object|null} 标准成本对象
   */
  static findCurrentByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM standard_costs 
      WHERE packaging_config_id = ? AND is_current = 1
    `);
    return stmt.get(packagingConfigId);
  }

  /**
   * 获取标准成本的所有历史版本
   * @param {number} packagingConfigId - 包装配置ID
   * @returns {Array} 历史版本列表
   */
  static getHistory(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        sc.*,
        u.real_name as setter_name
      FROM standard_costs sc
      JOIN users u ON sc.set_by = u.id
      WHERE sc.packaging_config_id = ?
      ORDER BY sc.version DESC
    `);
    return stmt.all(packagingConfigId);
  }

  /**
   * 获取指定包装配置的最大版本号
   * @param {number} packagingConfigId - 包装配置ID
   * @returns {number} 最大版本号，如果没有则返回0
   */
  static getMaxVersion(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT MAX(version) as max_version 
      FROM standard_costs 
      WHERE packaging_config_id = ?
    `);
    const result = stmt.get(packagingConfigId);
    return result.max_version || 0;
  }

  /**
   * 创建标准成本（从报价单）
   * @param {Object} data - 标准成本数据
   * @param {number} data.packaging_config_id - 包装配置ID
   * @param {number} data.quotation_id - 来源报价单ID
   * @param {number} data.base_cost - 基础成本价
   * @param {number} data.overhead_price - 管销价
   * @param {number} data.domestic_price - 内销价
   * @param {number} data.export_price - 外销价
   * @param {number} data.quantity - 数量
   * @param {string} data.currency - 货币
   * @param {string} data.sales_type - 销售类型
   * @param {number} data.set_by - 设置人ID
   * @returns {number} 新标准成本的ID
   */
  static create(data) {
    const db = dbManager.getDatabase();
    
    // 使用事务确保数据一致性
    const transaction = db.transaction(() => {
      // 获取当前最大版本号
      const maxVersion = this.getMaxVersion(data.packaging_config_id);
      const newVersion = maxVersion + 1;
      
      // 将旧版本标记为非当前
      if (maxVersion > 0) {
        const updateStmt = db.prepare(`
          UPDATE standard_costs 
          SET is_current = 0 
          WHERE packaging_config_id = ?
        `);
        updateStmt.run(data.packaging_config_id);
      }
      
      // 插入新版本
      const insertStmt = db.prepare(`
        INSERT INTO standard_costs (
          packaging_config_id, quotation_id, version, is_current,
          base_cost, overhead_price, domestic_price, export_price,
          quantity, currency, sales_type, set_by
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        data.packaging_config_id,
        data.quotation_id,
        newVersion,
        data.base_cost,
        data.overhead_price,
        data.domestic_price || null,
        data.export_price || null,
        data.quantity,
        data.currency || 'CNY',
        data.sales_type,
        data.set_by
      );
      
      return result.lastInsertRowid;
    });
    
    return transaction();
  }

  /**
   * 恢复历史版本
   * @param {number} packagingConfigId - 包装配置ID
   * @param {number} version - 要恢复的版本号
   * @param {number} setBy - 操作人ID
   * @returns {number} 新版本的ID
   */
  static restore(packagingConfigId, version, setBy) {
    const db = dbManager.getDatabase();
    
    // 获取要恢复的版本数据
    const stmt = db.prepare(`
      SELECT * FROM standard_costs 
      WHERE packaging_config_id = ? AND version = ?
    `);
    const oldVersion = stmt.get(packagingConfigId, version);
    
    if (!oldVersion) {
      throw new Error('历史版本不存在');
    }
    
    // 创建新版本（复制旧版本数据）
    return this.create({
      packaging_config_id: oldVersion.packaging_config_id,
      quotation_id: oldVersion.quotation_id,
      base_cost: oldVersion.base_cost,
      overhead_price: oldVersion.overhead_price,
      domestic_price: oldVersion.domestic_price,
      export_price: oldVersion.export_price,
      quantity: oldVersion.quantity,
      currency: oldVersion.currency,
      sales_type: oldVersion.sales_type,
      set_by: setBy
    });
  }

  /**
   * 删除指定包装配置的所有标准成本版本
   * @param {number} packagingConfigId - 包装配置ID
   * @returns {boolean} 是否删除成功
   */
  static deleteByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      DELETE FROM standard_costs 
      WHERE packaging_config_id = ?
    `);
    const result = stmt.run(packagingConfigId);
    return result.changes > 0;
  }

  /**
   * 根据报价单ID查找标准成本
   * @param {number} quotationId - 报价单ID
   * @returns {Object|null} 标准成本对象
   */
  static findByQuotationId(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM standard_costs 
      WHERE quotation_id = ? AND is_current = 1
    `);
    return stmt.get(quotationId);
  }
}

module.exports = StandardCost;
