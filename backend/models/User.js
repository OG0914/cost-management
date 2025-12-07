/**
 * 用户数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class User {
  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户对象或 null
   */
  static async findByUsername(username) {
    const result = await dbManager.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据 ID 查找用户
   * @param {number} id - 用户 ID
   * @returns {Promise<Object|null>} 用户对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<number>} 新用户的 ID
   */
  static async create(userData) {
    const { username, password, role, real_name, email } = userData;

    const result = await dbManager.query(
      `INSERT INTO users (username, password, role, real_name, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [username, password, role, real_name || null, email || null]
    );

    return result.rows[0].id;
  }

  /**
   * 获取所有用户（不包含密码）
   * @returns {Promise<Array>} 用户列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT id, username, role, real_name, email, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    return result.rows;
  }


  /**
   * 更新用户信息
   * @param {number} id - 用户 ID
   * @param {Object} userData - 更新的数据
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async update(id, userData) {
    const { role, real_name, email, is_active } = userData;

    // 构建动态更新语句
    const fields = [];
    const values = [];
    let paramIndex = 0;

    if (role !== undefined) {
      paramIndex++;
      fields.push(`role = $${paramIndex}`);
      values.push(role);
    }
    if (real_name !== undefined) {
      paramIndex++;
      fields.push(`real_name = $${paramIndex}`);
      values.push(real_name);
    }
    if (email !== undefined) {
      paramIndex++;
      fields.push(`email = $${paramIndex}`);
      values.push(email);
    }
    if (is_active !== undefined) {
      paramIndex++;
      fields.push(`is_active = $${paramIndex}`);
      values.push(is_active);
    }

    if (fields.length === 0) {
      return { rowCount: 0 };
    }

    fields.push('updated_at = NOW()');
    paramIndex++;
    values.push(id);

    const result = await dbManager.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return { rowCount: result.rowCount };
  }

  /**
   * 更新密码
   * @param {number} id - 用户 ID
   * @param {string} hashedPassword - 加密后的密码
   * @returns {Promise<Object>} 更新结果
   */
  static async updatePassword(id, hashedPassword) {
    const result = await dbManager.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 删除用户
   * @param {number} id - 用户 ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 检查用户名是否存在
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 是否存在
   */
  static async exists(username) {
    const result = await dbManager.query(
      'SELECT COUNT(*) as count FROM users WHERE username = $1',
      [username]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 检查用户是否有关联的报价单
   * @param {number} userId - 用户 ID
   * @returns {Promise<boolean>} 是否有关联
   */
  static async hasRelatedQuotations(userId) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count 
       FROM quotations 
       WHERE created_by = $1 OR reviewed_by = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  }


  /**
   * 删除用户及其关联数据（管理员专用）
   * @param {number} userId - 用户 ID
   * @returns {Promise<Object>} 删除结果
   */
  static async deleteWithRelations(userId) {
    try {
      return await dbManager.transaction(async (client) => {
        // 1. 统计要删除的报价单数量
        const countResult = await client.query(
          'SELECT COUNT(*) as count FROM quotations WHERE created_by = $1',
          [userId]
        );
        const deletedQuotations = parseInt(countResult.rows[0].count);

        // 2. 删除用户创建的所有报价单（会级联删除明细）
        await client.query(
          'DELETE FROM quotations WHERE created_by = $1',
          [userId]
        );

        // 3. 统计要更新的审核记录数量
        const countReviewResult = await client.query(
          'SELECT COUNT(*) as count FROM quotations WHERE reviewed_by = $1',
          [userId]
        );
        const updatedQuotations = parseInt(countReviewResult.rows[0].count);

        // 4. 将用户审核的报价单的 reviewed_by 设置为 NULL
        await client.query(
          'UPDATE quotations SET reviewed_by = NULL WHERE reviewed_by = $1',
          [userId]
        );

        // 5. 删除用户
        const deleteResult = await client.query(
          'DELETE FROM users WHERE id = $1',
          [userId]
        );

        return {
          success: deleteResult.rowCount > 0,
          deletedQuotations,
          updatedQuotations
        };
      });
    } catch (error) {
      console.error('删除用户及关联数据失败:', error);
      return {
        success: false,
        deletedQuotations: 0,
        updatedQuotations: 0
      };
    }
  }
}

module.exports = User;
