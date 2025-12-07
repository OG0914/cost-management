/**
 * 包装配置数据模型
 * 型号+包装方式的固定组合
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class PackagingConfig {
  /**
   * 获取所有包装配置
   * @returns {Promise<Array>} 包装配置列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT pc.*, m.model_name, m.model_category
      FROM packaging_configs pc
      LEFT JOIN models m ON pc.model_id = m.id
      WHERE pc.is_active = true
      ORDER BY pc.created_at DESC
    `);
    return result.rows;
  }

  /**
   * 根据型号 ID 获取包装配置
   * @param {number} modelId - 型号 ID
   * @returns {Promise<Array>} 包装配置列表
   */
  static async findByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT pc.*, m.model_name, m.model_category
       FROM packaging_configs pc
       LEFT JOIN models m ON pc.model_id = m.id
       WHERE pc.model_id = $1 AND pc.is_active = true
       ORDER BY pc.created_at DESC`,
      [modelId]
    );
    return result.rows;
  }

  /**
   * 根据 ID 查找包装配置
   * @param {number} id - 配置 ID
   * @returns {Promise<Object|null>} 包装配置对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT pc.*, m.model_name, m.model_category
       FROM packaging_configs pc
       LEFT JOIN models m ON pc.model_id = m.id
       WHERE pc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 检查配置名称是否已存在
   * @param {number} modelId - 型号 ID
   * @param {string} configName - 配置名称
   * @returns {Promise<boolean>} 是否存在
   */
  static async existsByModelAndName(modelId, configName) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count
       FROM packaging_configs
       WHERE model_id = $1 AND config_name = $2 AND is_active = true`,
      [modelId, configName]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 创建包装配置
   * @param {Object} data - 配置数据
   * @returns {Promise<number>} 新配置的 ID
   */
  static async create(data) {
    const { model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton } = data;
    
    const result = await dbManager.query(
      `INSERT INTO packaging_configs (model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton]
    );
    
    return result.rows[0].id;
  }

  /**
   * 更新包装配置
   * @param {number} id - 配置 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async update(id, data) {
    const { config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active } = data;
    
    const result = await dbManager.query(
      `UPDATE packaging_configs
       SET config_name = $1, pc_per_bag = $2, bags_per_box = $3, boxes_per_carton = $4, 
           is_active = $5, updated_at = NOW()
       WHERE id = $6`,
      [config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除包装配置（软删除）
   * @param {number} id - 配置 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async delete(id) {
    // 先获取当前配置信息
    const config = await this.findById(id);
    if (!config) {
      throw new Error('配置不存在');
    }
    
    // 软删除时，在配置名称后添加删除标记和时间戳，避免唯一性约束冲突
    const deletedName = `${config.config_name}_deleted_${Date.now()}`;
    
    const result = await dbManager.query(
      `UPDATE packaging_configs
       SET is_active = false, 
           config_name = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [deletedName, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 获取包装配置及其工序列表
   * @param {number} id - 配置 ID
   * @returns {Promise<Object|null>} 包装配置对象（含工序）或 null
   */
  static async findWithProcesses(id) {
    // 获取包装配置
    const config = await this.findById(id);
    if (!config) return null;

    // 获取工序列表
    const processResult = await dbManager.query(
      `SELECT * FROM process_configs
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [id]
    );
    config.processes = processResult.rows;

    return config;
  }

  /**
   * 获取包装配置及其工序和包材列表
   * @param {number} id - 配置 ID
   * @returns {Promise<Object|null>} 包装配置对象（含工序和包材）或 null
   */
  static async findWithDetails(id) {
    // 获取包装配置
    const config = await this.findById(id);
    if (!config) return null;

    // 获取工序列表
    const processResult = await dbManager.query(
      `SELECT * FROM process_configs
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [id]
    );
    config.processes = processResult.rows;

    // 获取包材列表
    const materialResult = await dbManager.query(
      `SELECT * FROM packaging_materials
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [id]
    );
    config.materials = materialResult.rows;

    return config;
  }
}

module.exports = PackagingConfig;
