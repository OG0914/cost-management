/**
 * 工序配置数据模型
 * 每个包装配置对应的工序列表
 */

const dbManager = require('../db/database');

class ProcessConfig {
  // 获取所有工序配置
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT pc.*, pkg.config_name, m.model_name
      FROM process_configs pc
      LEFT JOIN packaging_configs pkg ON pc.packaging_config_id = pkg.id
      LEFT JOIN models m ON pkg.model_id = m.id
      ORDER BY pc.sort_order, pc.id
    `);
    return stmt.all();
  }

  // 根据包装配置 ID 获取工序列表
  static findByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM process_configs
      WHERE packaging_config_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    return stmt.all(packagingConfigId);
  }

  // 根据 ID 查找工序配置
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT pc.*, pkg.config_name, m.model_name
      FROM process_configs pc
      LEFT JOIN packaging_configs pkg ON pc.packaging_config_id = pkg.id
      LEFT JOIN models m ON pkg.model_id = m.id
      WHERE pc.id = ?
    `);
    return stmt.get(id);
  }

  // 创建工序配置
  static create(data) {
    const db = dbManager.getDatabase();
    const { packaging_config_id, process_name, unit_price, sort_order } = data;
    
    const stmt = db.prepare(`
      INSERT INTO process_configs (packaging_config_id, process_name, unit_price, sort_order)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      packaging_config_id, 
      process_name, 
      unit_price, 
      sort_order || 0
    );
    return result.lastInsertRowid;
  }

  // 批量创建工序配置
  static createBatch(packagingConfigId, processes) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO process_configs (packaging_config_id, process_name, unit_price, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(
          packagingConfigId,
          item.process_name,
          item.unit_price,
          item.sort_order || 0
        );
      }
    });

    insertMany(processes);
  }

  // 更新工序配置
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { process_name, unit_price, sort_order, is_active } = data;
    
    const stmt = db.prepare(`
      UPDATE process_configs
      SET process_name = ?, unit_price = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(process_name, unit_price, sort_order, is_active, id);
  }

  // 删除工序配置（软删除）
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE process_configs
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  }

  // 批量删除工序配置
  static deleteByPackagingConfigId(packagingConfigId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      DELETE FROM process_configs
      WHERE packaging_config_id = ?
    `);
    return stmt.run(packagingConfigId);
  }

  // 更新排序
  static updateSortOrder(id, sortOrder) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE process_configs
      SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(sortOrder, id);
  }
}

module.exports = ProcessConfig;
