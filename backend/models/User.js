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
      SELECT id, username, role, real_name, email, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 更新用户信息
  static update(id, userData) {
    const db = dbManager.getDatabase();
    const { role, real_name, email } = userData;
    
    const stmt = db.prepare(`
      UPDATE users
      SET role = ?, real_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(role, real_name, email, id);
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
}

module.exports = User;
