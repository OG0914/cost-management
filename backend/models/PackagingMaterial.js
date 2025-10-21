/**
 * 包材数据模型
 */

const dbManager = require('../db/database');

class PackagingMaterial {
  // 根据包装配置ID获取包材列表
  static findByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM packaging_materials
      WHERE packaging_config_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    return stmt.all(packagingConfigId);
  }

  // 根据ID查找包材
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM packaging_materials
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  // 创建包材
  static create(data) {
    const db = dbManager.getDatabase();
    const { packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order } = data;
    
    const stmt = db.prepare(`
      INSERT INTO packaging_materials (packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      packaging_config_id, 
      material_name, 
      basic_usage, 
      unit_price, 
      carton_volume || null, 
      sort_order || 0
    );
    return result.lastInsertRowid;
  }

  // 批量创建包材
  static createBatch(packagingConfigId, materials) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO packaging_materials (packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((materials) => {
      for (const material of materials) {
        stmt.run(
          packagingConfigId,
          material.material_name,
          material.basic_usage,
          material.unit_price,
          material.carton_volume || null,
          material.sort_order || 0
        );
      }
    });

    insertMany(materials);
  }

  // 更新包材
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { material_name, basic_usage, unit_price, carton_volume, sort_order, is_active } = data;
    
    const stmt = db.prepare(`
      UPDATE packaging_materials
      SET material_name = ?, basic_usage = ?, unit_price = ?, carton_volume = ?, 
          sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      material_name, 
      basic_usage, 
      unit_price, 
      carton_volume || null, 
      sort_order || 0, 
      is_active !== undefined ? is_active : 1, 
      id
    );
  }

  // 删除包材（软删除）
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE packaging_materials
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  }

  // 根据包装配置ID删除所有包材
  static deleteByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      DELETE FROM packaging_materials
      WHERE packaging_config_id = ?
    `);
    return stmt.run(packagingConfigId);
  }
}

module.exports = PackagingMaterial;
