/**
 * 型号数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class Model {
  /**
   * 获取所有型号
   * @returns {Promise<Array>} 型号列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      ORDER BY m.created_at DESC
    `);
    return result.rows;
  }

  /**
   * 获取所有激活的型号
   * @returns {Promise<Array>} 激活的型号列表
   */
  static async findActive() {
    const result = await dbManager.query(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      WHERE m.is_active = true
      ORDER BY m.created_at DESC
    `);
    return result.rows;
  }

  /**
   * 根据法规 ID 获取型号
   * @param {number} regulationId - 法规 ID
   * @returns {Promise<Array>} 型号列表
   */
  static async findByRegulationId(regulationId) {
    const result = await dbManager.query(
      `SELECT * FROM models
       WHERE regulation_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [regulationId]
    );
    return result.rows;
  }

  /**
   * 根据 ID 查找型号
   * @param {number} id - 型号 ID
   * @returns {Promise<Object|null>} 型号对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT m.*, r.name as regulation_name
       FROM models m
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据型号名称查找
   * @param {string} modelName - 型号名称
   * @returns {Promise<Object|null>} 型号对象或 null
   */
  static async findByName(modelName) {
    const result = await dbManager.query(
      `SELECT m.*, r.name as regulation_name
       FROM models m
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE m.model_name = $1`,
      [modelName]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据法规ID和型号名称查找
   * @param {number} regulationId - 法规 ID
   * @param {string} modelName - 型号名称
   * @returns {Promise<Object|null>} 型号对象或 null
   */
  static async findByRegulationAndName(regulationId, modelName) {
    const result = await dbManager.query(
      `SELECT m.*, r.name as regulation_name
       FROM models m
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE m.regulation_id = $1 AND m.model_name = $2`,
      [regulationId, modelName]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建型号
   * @param {Object} data - 型号数据
   * @returns {Promise<number>} 新型号的 ID
   */
  static async create(data) {
    const { regulation_id, model_name, model_category } = data;
    
    const result = await dbManager.query(
      `INSERT INTO models (regulation_id, model_name, model_category)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [regulation_id, model_name, model_category || null]
    );
    
    return result.rows[0].id;
  }


  /**
   * 更新型号
   * @param {number} id - 型号 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, data) {
    const { regulation_id, model_name, model_category, is_active } = data;
    
    const result = await dbManager.query(
      `UPDATE models
       SET regulation_id = $1, model_name = $2, model_category = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5`,
      [regulation_id, model_name, model_category, is_active, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除型号（硬删除，级联删除相关数据）
   * @param {number} id - 型号 ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await dbManager.transaction(async (client) => {
      // 删除相关的原料数据（注意：materials 表没有 model_id 字段，跳过）
      // 删除相关的工序数据
      await client.query('DELETE FROM processes WHERE model_id = $1', [id]);
      
      // 删除相关的包材数据
      await client.query('DELETE FROM packaging WHERE model_id = $1', [id]);
      
      // 获取相关的包装配置
      const configsResult = await client.query(
        'SELECT id FROM packaging_configs WHERE model_id = $1',
        [id]
      );
      
      // 删除相关的工序配置和包材配置
      for (const config of configsResult.rows) {
        await client.query('DELETE FROM process_configs WHERE packaging_config_id = $1', [config.id]);
        await client.query('DELETE FROM packaging_materials WHERE packaging_config_id = $1', [config.id]);
      }
      
      // 删除包装配置
      await client.query('DELETE FROM packaging_configs WHERE model_id = $1', [id]);
      
      // 最后删除型号本身
      await client.query('DELETE FROM models WHERE id = $1', [id]);
    });
  }

  /**
   * 检查型号是否被报价单使用
   * @param {number} id - 型号 ID
   * @returns {Promise<boolean>} 是否被使用
   */
  static async isUsedInQuotations(id) {
    const result = await dbManager.query(
      'SELECT COUNT(*) as count FROM quotations WHERE model_id = $1',
      [id]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 根据型号分类和法规ID获取型号
   * @param {string} modelCategory - 型号分类
   * @param {number} regulationId - 法规 ID
   * @returns {Promise<Array>} 型号列表
   */
  static async findByModelCategoryAndRegulation(modelCategory, regulationId) {
    const result = await dbManager.query(
      `SELECT m.*, r.name as regulation_name
       FROM models m
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE m.model_category = $1 AND m.regulation_id = $2 AND m.is_active = true
       ORDER BY m.created_at DESC`,
      [modelCategory, regulationId]
    );
    return result.rows;
  }

  /**
   * 根据型号分类获取型号
   * @param {string} modelCategory - 型号分类
   * @returns {Promise<Array>} 型号列表
   */
  static async findByModelCategory(modelCategory) {
    const result = await dbManager.query(
      `SELECT m.*, r.name as regulation_name
       FROM models m
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE m.model_category = $1 AND m.is_active = true
       ORDER BY m.created_at DESC`,
      [modelCategory]
    );
    return result.rows;
  }

  /**
   * 获取所有型号分类（去重）
   * @returns {Promise<Array<string>>} 型号分类列表
   */
  static async getAllCategories() {
    const result = await dbManager.query(`
      SELECT DISTINCT model_category 
      FROM models 
      WHERE model_category IS NOT NULL AND model_category != '' AND is_active = true
      ORDER BY model_category
    `);
    return result.rows.map(row => row.model_category);
  }
}

module.exports = Model;
