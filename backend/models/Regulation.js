/**
 * 法规类别数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class Regulation {
  /**
   * 获取所有法规类别
   * @returns {Promise<Array>} 法规列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT * FROM regulations
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * 获取所有激活的法规类别
   * @returns {Promise<Array>} 激活的法规列表
   */
  static async findActive() {
    const result = await dbManager.query(`
      SELECT * FROM regulations
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * 根据 ID 查找法规
   * @param {number} id - 法规 ID
   * @returns {Promise<Object|null>} 法规对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM regulations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建法规类别
   * @param {Object} data - 法规数据
   * @returns {Promise<number>} 新法规的 ID
   */
  static async create(data) {
    const { name, description } = data;
    
    const result = await dbManager.query(
      `INSERT INTO regulations (name, description)
       VALUES ($1, $2)
       RETURNING id`,
      [name, description || null]
    );
    
    return result.rows[0].id;
  }

  /**
   * 更新法规类别
   * @param {number} id - 法规 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, data) {
    const { name, description, is_active } = data;
    
    const result = await dbManager.query(
      `UPDATE regulations
       SET name = $1, description = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4`,
      [name, description, is_active, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除法规类别（软删除，设置为不激活）
   * @param {number} id - 法规 ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const result = await dbManager.query(
      `UPDATE regulations
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 根据名称查找法规
   * @param {string} name - 法规名称
   * @returns {Promise<Object|null>} 法规对象或 null
   */
  static async findByName(name) {
    const result = await dbManager.query(
      'SELECT * FROM regulations WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * 检查法规名称是否存在
   * @param {string} name - 法规名称
   * @param {number|null} excludeId - 排除的 ID
   * @returns {Promise<boolean>} 是否存在
   */
  static async existsByName(name, excludeId = null) {
    let result;
    
    if (excludeId) {
      result = await dbManager.query(
        'SELECT COUNT(*) as count FROM regulations WHERE name = $1 AND id != $2',
        [name, excludeId]
      );
    } else {
      result = await dbManager.query(
        'SELECT COUNT(*) as count FROM regulations WHERE name = $1',
        [name]
      );
    }
    
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = Regulation;
