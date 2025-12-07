/**
 * 工序配置数据模型
 * 每个包装配置对应的工序列表
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class ProcessConfig {
  /**
   * 获取所有工序配置
   * @returns {Promise<Array>} 工序配置列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT pc.*, pkg.config_name, m.model_name
      FROM process_configs pc
      LEFT JOIN packaging_configs pkg ON pc.packaging_config_id = pkg.id
      LEFT JOIN models m ON pkg.model_id = m.id
      ORDER BY pc.sort_order, pc.id
    `);
    return result.rows;
  }

  /**
   * 根据包装配置 ID 获取工序列表
   * @param {number} packagingConfigId - 包装配置 ID
   * @returns {Promise<Array>} 工序列表
   */
  static async findByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query(
      `SELECT * FROM process_configs
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [packagingConfigId]
    );
    return result.rows;
  }

  /**
   * 根据 ID 查找工序配置
   * @param {number} id - 工序配置 ID
   * @returns {Promise<Object|null>} 工序配置对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT pc.*, pkg.config_name, m.model_name
       FROM process_configs pc
       LEFT JOIN packaging_configs pkg ON pc.packaging_config_id = pkg.id
       LEFT JOIN models m ON pkg.model_id = m.id
       WHERE pc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建工序配置
   * @param {Object} data - 工序配置数据
   * @returns {Promise<number>} 新工序配置的 ID
   */
  static async create(data) {
    const { packaging_config_id, process_name, unit_price, sort_order } = data;
    
    const result = await dbManager.query(
      `INSERT INTO process_configs (packaging_config_id, process_name, unit_price, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        packaging_config_id, 
        process_name, 
        unit_price, 
        sort_order || 0
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 批量创建工序配置
   * @param {number} packagingConfigId - 包装配置 ID
   * @param {Array} processes - 工序数组
   * @returns {Promise<number>} 创建的工序数量
   */
  static async createBatch(packagingConfigId, processes) {
    return await dbManager.transaction(async (client) => {
      for (const item of processes) {
        await client.query(
          `INSERT INTO process_configs (packaging_config_id, process_name, unit_price, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [
            packagingConfigId,
            item.process_name,
            item.unit_price,
            item.sort_order || 0
          ]
        );
      }
      return processes.length;
    });
  }

  /**
   * 更新工序配置
   * @param {number} id - 工序配置 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async update(id, data) {
    const { process_name, unit_price, sort_order, is_active } = data;
    
    const result = await dbManager.query(
      `UPDATE process_configs
       SET process_name = $1, unit_price = $2, sort_order = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5`,
      [process_name, unit_price, sort_order, is_active, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除工序配置（软删除）
   * @param {number} id - 工序配置 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async delete(id) {
    const result = await dbManager.query(
      `UPDATE process_configs
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 批量删除工序配置
   * @param {number} packagingConfigId - 包装配置 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async deleteByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query(
      'DELETE FROM process_configs WHERE packaging_config_id = $1',
      [packagingConfigId]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 更新排序
   * @param {number} id - 工序配置 ID
   * @param {number} sortOrder - 排序顺序
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async updateSortOrder(id, sortOrder) {
    const result = await dbManager.query(
      `UPDATE process_configs
       SET sort_order = $1, updated_at = NOW()
       WHERE id = $2`,
      [sortOrder, id]
    );
    return { rowCount: result.rowCount };
  }
}

module.exports = ProcessConfig;
