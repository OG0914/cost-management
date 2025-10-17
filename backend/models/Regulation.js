/**
 * 法规类别数据模型
 */

const dbManager = require('../db/database');

class Regulation {
  // 获取所有法规类别
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM regulations
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 获取所有激活的法规类别
  static findActive() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM regulations
      WHERE is_active = 1
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 根据 ID 查找法规
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM regulations WHERE id = ?');
    return stmt.get(id);
  }

  // 创建法规类别
  static create(data) {
    const db = dbManager.getDatabase();
    const { name, description } = data;
    
    const stmt = db.prepare(`
      INSERT INTO regulations (name, description)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(name, description || null);
    return result.lastInsertRowid;
  }

  // 更新法规类别
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { name, description, is_active } = data;
    
    const stmt = db.prepare(`
      UPDATE regulations
      SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(name, description, is_active, id);
  }

  // 删除法规类别（软删除，设置为不激活）
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE regulations
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  }

  // 检查法规名称是否存在
  static existsByName(name, excludeId = null) {
    const db = dbManager.getDatabase();
    let stmt;
    let result;
    
    if (excludeId) {
      stmt = db.prepare('SELECT COUNT(*) as count FROM regulations WHERE name = ? AND id != ?');
      result = stmt.get(name, excludeId);
    } else {
      stmt = db.prepare('SELECT COUNT(*) as count FROM regulations WHERE name = ?');
      result = stmt.get(name);
    }
    
    return result.count > 0;
  }
}

module.exports = Regulation;
