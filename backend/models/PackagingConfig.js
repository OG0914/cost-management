/**
 * 包装配置数据模型
 * 型号+包装方式的固定组合
 */

const dbManager = require('../db/database');

class PackagingConfig {
  // 获取所有包装配置
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT pc.*, m.model_name
      FROM packaging_configs pc
      LEFT JOIN models m ON pc.model_id = m.id
      WHERE pc.is_active = 1
      ORDER BY pc.created_at DESC
    `);
    return stmt.all();
  }

  // 根据型号 ID 获取包装配置
  static findByModelId(modelId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT pc.*, m.model_name
      FROM packaging_configs pc
      LEFT JOIN models m ON pc.model_id = m.id
      WHERE pc.model_id = ? AND pc.is_active = 1
      ORDER BY pc.created_at DESC
    `);
    return stmt.all(modelId);
  }

  // 根据 ID 查找包装配置
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT pc.*, m.model_name
      FROM packaging_configs pc
      LEFT JOIN models m ON pc.model_id = m.id
      WHERE pc.id = ?
    `);
    return stmt.get(id);
  }

  // 检查配置名称是否已存在
  static existsByModelAndName(modelId, configName) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM packaging_configs
      WHERE model_id = ? AND config_name = ? AND is_active = 1
    `);
    const result = stmt.get(modelId, configName);
    return result.count > 0;
  }

  // 创建包装配置
  static create(data) {
    const db = dbManager.getDatabase();
    const { model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton } = data;
    
    const stmt = db.prepare(`
      INSERT INTO packaging_configs (model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton);
    return result.lastInsertRowid;
  }

  // 更新包装配置
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active } = data;
    
    const stmt = db.prepare(`
      UPDATE packaging_configs
      SET config_name = ?, pc_per_bag = ?, bags_per_box = ?, boxes_per_carton = ?, 
          is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active, id);
  }

  // 删除包装配置（软删除）
  static delete(id) {
    const db = dbManager.getDatabase();
    
    // 先获取当前配置信息
    const config = this.findById(id);
    if (!config) {
      throw new Error('配置不存在');
    }
    
    // 软删除时，在配置名称后添加删除标记和时间戳，避免唯一性约束冲突
    const deletedName = `${config.config_name}_deleted_${Date.now()}`;
    
    const stmt = db.prepare(`
      UPDATE packaging_configs
      SET is_active = 0, 
          config_name = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(deletedName, id);
  }

  // 获取包装配置及其工序列表
  static findWithProcesses(id) {
    const db = dbManager.getDatabase();
    
    // 获取包装配置
    const config = this.findById(id);
    if (!config) return null;

    // 获取工序列表
    const processStmt = db.prepare(`
      SELECT * FROM process_configs
      WHERE packaging_config_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    config.processes = processStmt.all(id);

    return config;
  }

  // 获取包装配置及其工序和包材列表
  static findWithDetails(id) {
    const db = dbManager.getDatabase();
    
    // 获取包装配置
    const config = this.findById(id);
    if (!config) return null;

    // 获取工序列表
    const processStmt = db.prepare(`
      SELECT * FROM process_configs
      WHERE packaging_config_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    config.processes = processStmt.all(id);

    // 获取包材列表
    const materialStmt = db.prepare(`
      SELECT * FROM packaging_materials
      WHERE packaging_config_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    config.materials = materialStmt.all(id);

    return config;
  }
}

module.exports = PackagingConfig;
