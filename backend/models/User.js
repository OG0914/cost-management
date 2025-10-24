/**
 * 用户数据模型
 */

const dbManager = require('../db/database');

class User {
  // 根据用户名查找用户
  static findByUsername(username) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  // 根据 ID 查找用户
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // 创建新用户
  static create(userData) {
    const db = dbManager.getDatabase();
    const { username, password, role, real_name, email } = userData;

    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, real_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, password, role, real_name || null, email || null);
    return result.lastInsertRowid;
  }

  // 获取所有用户（不包含密码）
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT id, username, role, real_name, email, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 更新用户信息
  static update(id, userData) {
    const db = dbManager.getDatabase();
    const { role, real_name, email, is_active } = userData;

    // 构建动态更新语句
    const fields = [];
    const values = [];

    if (role !== undefined) {
      fields.push('role = ?');
      values.push(role);
    }
    if (real_name !== undefined) {
      fields.push('real_name = ?');
      values.push(real_name);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    return stmt.run(...values);
  }

  // 更新密码
  static updatePassword(id, hashedPassword) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(hashedPassword, id);
  }

  // 删除用户
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  // 检查用户名是否存在
  static exists(username) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
    const result = stmt.get(username);
    return result.count > 0;
  }

  // 检查用户是否有关联的报价单
  static hasRelatedQuotations(userId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM quotations 
      WHERE created_by = ? OR reviewed_by = ?
    `);
    const result = stmt.get(userId, userId);
    return result.count > 0;
  }

  // 删除用户及其关联数据（管理员专用）
  static deleteWithRelations(userId) {
    const db = dbManager.getDatabase();

    try {
      // 使用事务确保数据一致性
      const transaction = db.transaction(() => {
        // 1. 统计要删除的报价单数量
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE created_by = ?');
        const { count: deletedQuotations } = countStmt.get(userId);

        // 2. 删除用户创建的所有报价单（会级联删除明细）
        const deleteQuotationsStmt = db.prepare('DELETE FROM quotations WHERE created_by = ?');
        deleteQuotationsStmt.run(userId);

        // 3. 统计要更新的审核记录数量
        const countReviewStmt = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE reviewed_by = ?');
        const { count: updatedQuotations } = countReviewStmt.get(userId);

        // 4. 将用户审核的报价单的 reviewed_by 设置为 NULL
        const updateReviewStmt = db.prepare('UPDATE quotations SET reviewed_by = NULL WHERE reviewed_by = ?');
        updateReviewStmt.run(userId);

        // 5. 删除用户
        const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = deleteUserStmt.run(userId);

        return {
          success: result.changes > 0,
          deletedQuotations,
          updatedQuotations
        };
      });

      return transaction();
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
