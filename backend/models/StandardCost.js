/**
 * 标准成本数据模型
 * 管理标准成本的创建、查询、版本控制等操作
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class StandardCost {
  /**
   * 获取所有当前版本的标准成本
   * @param {Object} options - 查询选项
   * @param {string} options.model_category - 型号分类过滤
   * @param {string} options.model_name - 型号名称过滤
   * @returns {Promise<Array>} 标准成本列表
   */
  static async findAllCurrent(options = {}) {
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
        u.real_name as setter_name,
        q.quotation_no
      FROM standard_costs sc
      JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
      JOIN models m ON pc.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      JOIN users u ON sc.set_by = u.id
      LEFT JOIN quotations q ON sc.quotation_id = q.id
      WHERE sc.is_current = true
    `;
    
    const params = [];
    let paramIndex = 0;
    
    if (options.model_category) {
      paramIndex++;
      sql += ` AND m.model_category = $${paramIndex}`;
      params.push(options.model_category);
    }
    
    if (options.model_name) {
      paramIndex++;
      sql += ` AND m.model_name LIKE $${paramIndex}`;
      params.push(`%${options.model_name}%`);
    }
    
    sql += ' ORDER BY sc.created_at DESC';
    
    const result = await dbManager.query(sql, params);
    return result.rows;
  }

  /**
   * 根据ID查找标准成本
   * @param {number} id - 标准成本ID
   * @returns {Promise<Object|null>} 标准成本对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT 
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
      WHERE sc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }


  /**
   * 根据包装配置ID查找当前标准成本
   * @param {number} packagingConfigId - 包装配置ID
   * @param {string} salesType - 销售类型（可选，如果提供则按销售类型过滤）
   * @returns {Promise<Object|null>} 标准成本对象或 null
   */
  static async findCurrentByPackagingConfigId(packagingConfigId, salesType = null) {
    if (salesType) {
      const result = await dbManager.query(
        `SELECT * FROM standard_costs 
         WHERE packaging_config_id = $1 AND sales_type = $2 AND is_current = true`,
        [packagingConfigId, salesType]
      );
      return result.rows[0] || null;
    } else {
      const result = await dbManager.query(
        `SELECT * FROM standard_costs 
         WHERE packaging_config_id = $1 AND is_current = true`,
        [packagingConfigId]
      );
      return result.rows[0] || null;
    }
  }

  /**
   * 获取标准成本的所有历史版本
   * @param {number} packagingConfigId - 包装配置ID
   * @param {string} salesType - 销售类型（可选）
   * @returns {Promise<Array>} 历史版本列表
   */
  static async getHistory(packagingConfigId, salesType = null) {
    if (salesType) {
      const result = await dbManager.query(
        `SELECT 
          sc.*,
          u.real_name as setter_name
        FROM standard_costs sc
        JOIN users u ON sc.set_by = u.id
        WHERE sc.packaging_config_id = $1 AND sc.sales_type = $2
        ORDER BY sc.version DESC`,
        [packagingConfigId, salesType]
      );
      return result.rows;
    } else {
      const result = await dbManager.query(
        `SELECT 
          sc.*,
          u.real_name as setter_name
        FROM standard_costs sc
        JOIN users u ON sc.set_by = u.id
        WHERE sc.packaging_config_id = $1
        ORDER BY sc.version DESC`,
        [packagingConfigId]
      );
      return result.rows;
    }
  }

  /**
   * 获取指定包装配置和销售类型的最大版本号
   * @param {number} packagingConfigId - 包装配置ID
   * @param {string} salesType - 销售类型
   * @returns {Promise<number>} 最大版本号，如果没有则返回0
   */
  static async getMaxVersion(packagingConfigId, salesType) {
    const result = await dbManager.query(
      `SELECT MAX(version) as max_version 
       FROM standard_costs 
       WHERE packaging_config_id = $1 AND sales_type = $2`,
      [packagingConfigId, salesType]
    );
    return result.rows[0].max_version || 0;
  }

  /**
   * 创建标准成本（从报价单）
   * @param {Object} data - 标准成本数据
   * @returns {Promise<number>} 新标准成本的ID
   */
  static async create(data) {
    return await dbManager.transaction(async (client) => {
      // 获取当前最大版本号（基于 packaging_config_id + sales_type）
      const maxVersionResult = await client.query(
        `SELECT MAX(version) as max_version 
         FROM standard_costs 
         WHERE packaging_config_id = $1 AND sales_type = $2`,
        [data.packaging_config_id, data.sales_type]
      );
      const maxVersion = maxVersionResult.rows[0].max_version || 0;
      const newVersion = maxVersion + 1;
      
      // 将同一 packaging_config_id + sales_type 的旧版本标记为非当前
      if (maxVersion > 0) {
        await client.query(
          `UPDATE standard_costs 
           SET is_current = false 
           WHERE packaging_config_id = $1 AND sales_type = $2`,
          [data.packaging_config_id, data.sales_type]
        );
      }
      
      // 插入新版本
      const insertResult = await client.query(
        `INSERT INTO standard_costs (
          packaging_config_id, quotation_id, version, is_current,
          base_cost, overhead_price, domestic_price, export_price,
          quantity, currency, sales_type, set_by
        ) VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
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
        ]
      );
      
      return insertResult.rows[0].id;
    });
  }


  /**
   * 恢复历史版本
   * @param {number} packagingConfigId - 包装配置ID
   * @param {string} salesType - 销售类型
   * @param {number} version - 要恢复的版本号
   * @param {number} setBy - 操作人ID
   * @returns {Promise<number>} 新版本的ID
   */
  static async restore(packagingConfigId, salesType, version, setBy) {
    // 获取要恢复的版本数据
    const result = await dbManager.query(
      `SELECT * FROM standard_costs 
       WHERE packaging_config_id = $1 AND sales_type = $2 AND version = $3`,
      [packagingConfigId, salesType, version]
    );
    const oldVersion = result.rows[0];
    
    if (!oldVersion) {
      throw new Error('历史版本不存在');
    }
    
    // 创建新版本（复制旧版本数据）
    return await this.create({
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
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query(
      'DELETE FROM standard_costs WHERE packaging_config_id = $1',
      [packagingConfigId]
    );
    return result.rowCount > 0;
  }

  /**
   * 根据报价单ID查找标准成本
   * @param {number} quotationId - 报价单ID
   * @returns {Promise<Object|null>} 标准成本对象或 null
   */
  static async findByQuotationId(quotationId) {
    const result = await dbManager.query(
      `SELECT * FROM standard_costs 
       WHERE quotation_id = $1 AND is_current = true`,
      [quotationId]
    );
    return result.rows[0] || null;
  }
}

module.exports = StandardCost;
