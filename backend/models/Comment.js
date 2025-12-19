/**
 * 批注数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class Comment {
  /**
   * 创建批注
   * @param {Object} data - 批注数据
   * @returns {Promise<number>} 新批注的 ID
   */
  static async create(data) {
    const result = await dbManager.query(
      `INSERT INTO comments (quotation_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING id`,
      [data.quotation_id, data.user_id, data.content]
    );
    return result.rows[0].id;
  }

  /**
   * 根据报价单ID获取批注列表
   * @param {number} quotationId - 报价单ID
   * @returns {Promise<Array>} 批注列表
   */
  static async findByQuotationId(quotationId) {
    const result = await dbManager.query(
      `SELECT c.*, u.real_name as user_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.quotation_id = $1
       ORDER BY c.created_at DESC`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * 根据ID获取批注
   * @param {number} id - 批注ID
   * @returns {Promise<Object|null>} 批注对象
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT c.*, u.real_name as user_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 删除批注
   * @param {number} id - 批注ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM comments WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = Comment;
