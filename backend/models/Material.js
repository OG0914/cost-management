/**
 * 原料数据模型
 */

const dbManager = require('../db/database');

class Material {
  // 获取所有原料
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM materials
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 根据厂商获取原料
  static findByManufacturer(manufacturer) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM materials
      WHERE manufacturer = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(manufacturer);
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
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = data;
    
    console.log('Material.create 接收到的数据:', {
      item_no,
      name,
      unit,
      price,
      currency,
      manufacturer,
      usage_amount
    });
    
    const stmt = db.prepare(`
      INSERT INTO materials (item_no, name, unit, price, currency, manufacturer, usage_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      item_no,
      name,
      unit,
      price,
      currency || 'CNY',
      manufacturer || null,
      usage_amount || null
    );
    return result.lastInsertRowid;
  }

  // 批量创建原料
  static batchCreate(materials) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO materials (item_no, name, unit, price, currency, manufacturer, usage_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(
          item.item_no,
          item.name,
          item.unit,
          item.price,
          item.currency || 'CNY',
          item.manufacturer || null,
          item.usage_amount || null
        );
      }
    });
    
    insertMany(materials);
  }

  // 更新原料
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = data;
    
    // 记录价格历史
    const oldMaterial = this.findById(id);
    if (oldMaterial && oldMaterial.price !== price) {
      this.recordPriceHistory(id, oldMaterial.price, price);
    }
    
    const stmt = db.prepare(`
      UPDATE materials
      SET item_no = ?, name = ?, unit = ?, price = ?, currency = ?, manufacturer = ?, usage_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(item_no, name, unit, price, currency, manufacturer, usage_amount, id);
  }

  // 删除原料
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM materials WHERE id = ?');
    return stmt.run(id);
  }

  // 根据品号查找原料（用于导入时更新）
  static findByItemNo(itemNo) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM materials WHERE item_no = ?');
    return stmt.get(itemNo);
  }

  // 根据名称查找原料
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
