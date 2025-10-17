/**
 * 原料数据模型
 */

const dbManager = require('../db/database');

class Material {
  // 获取所有原料
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, mo.model_name
      FROM materials m
      LEFT JOIN models mo ON m.model_id = mo.id
      ORDER BY m.created_at DESC
    `);
    return stmt.all();
  }

  // 根据型号 ID 获取原料
  static findByModelId(modelId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM materials
      WHERE model_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(modelId);
  }

  // 根据 ID 查找原料
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM materials WHERE id = ?');
    return stmt.get(id);
  }

  // 创建原料
  static create(data) {
    const db = dbManager.getDatabase();
    const { name, unit, price, currency, model_id, usage_amount } = data;
    
    const stmt = db.prepare(`
      INSERT INTO materials (name, unit, price, currency, model_id, usage_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, unit, price, currency || 'CNY', model_id || null, usage_amount || null);
    return result.lastInsertRowid;
  }

  // 批量创建原料
  static batchCreate(materials) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO materials (name, unit, price, currency, model_id, usage_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(
          item.name,
          item.unit,
          item.price,
          item.currency || 'CNY',
          item.model_id || null,
          item.usage_amount || null
        );
      }
    });
    
    insertMany(materials);
  }

  // 更新原料
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { name, unit, price, currency, model_id, usage_amount } = data;
    
    // 记录价格历史
    const oldMaterial = this.findById(id);
    if (oldMaterial && oldMaterial.price !== price) {
      this.recordPriceHistory(id, oldMaterial.price, price);
    }
    
    const stmt = db.prepare(`
      UPDATE materials
      SET name = ?, unit = ?, price = ?, currency = ?, model_id = ?, usage_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(name, unit, price, currency, model_id, usage_amount, id);
  }

  // 删除原料
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM materials WHERE id = ?');
    return stmt.run(id);
  }

  // 根据名称查找原料（用于导入时更新）
  static findByName(name) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM materials WHERE name = ?');
    return stmt.get(name);
  }

  // 记录价格历史
  static recordPriceHistory(materialId, oldPrice, newPrice) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO price_history (item_type, item_id, old_price, new_price, changed_by)
      VALUES ('material', ?, ?, ?, 1)
    `);
    stmt.run(materialId, oldPrice, newPrice);
  }

  // 获取价格历史
  static getPriceHistory(materialId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM price_history
      WHERE item_type = 'material' AND item_id = ?
      ORDER BY changed_at DESC
    `);
    return stmt.all(materialId);
  }
}

module.exports = Material;
