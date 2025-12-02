/**
 * 型号数据模型
 */

const dbManager = require('../db/database');

class Model {
  // 获取所有型号
  static findAll() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      ORDER BY m.created_at DESC
    `);
    return stmt.all();
  }

  // 获取所有激活的型号
  static findActive() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      WHERE m.is_active = 1
      ORDER BY m.created_at DESC
    `);
    return stmt.all();
  }

  // 根据法规 ID 获取型号
  static findByRegulationId(regulationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM models
      WHERE regulation_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `);
    return stmt.all(regulationId);
  }

  // 根据 ID 查找型号
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      WHERE m.id = ?
    `);
    return stmt.get(id);
  }

  // 根据型号名称查找
  static findByName(modelName) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      WHERE m.model_name = ?
    `);
    return stmt.get(modelName);
  }

  // 根据法规ID和型号名称查找
  static findByRegulationAndName(regulationId, modelName) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, r.name as regulation_name
      FROM models m
      LEFT JOIN regulations r ON m.regulation_id = r.id
      WHERE m.regulation_id = ? AND m.model_name = ?
    `);
    return stmt.get(regulationId, modelName);
  }

  // 创建型号
  static create(data) {
    const db = dbManager.getDatabase();
    const { regulation_id, model_name, remark } = data;
    
    const stmt = db.prepare(`
      INSERT INTO models (regulation_id, model_name, remark)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(regulation_id, model_name, remark || null);
    return result.lastInsertRowid;
  }

  // 更新型号
  static update(id, data) {
    const db = dbManager.getDatabase();
    const { regulation_id, model_name, remark, is_active } = data;
    
    const stmt = db.prepare(`
      UPDATE models
      SET regulation_id = ?, model_name = ?, remark = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(regulation_id, model_name, remark, is_active, id);
  }

  // 删除型号（硬删除，级联删除相关数据）
  static delete(id) {
    const db = dbManager.getDatabase();
    
    // 使用事务确保数据一致性
    const deleteTransaction = db.transaction(() => {
      // 删除相关的原料数据
      db.prepare('DELETE FROM materials WHERE model_id = ?').run(id);
      
      // 删除相关的工序数据
      db.prepare('DELETE FROM processes WHERE model_id = ?').run(id);
      
      // 删除相关的包材数据
      db.prepare('DELETE FROM packaging WHERE model_id = ?').run(id);
      
      // 删除相关的包装配置及其工序配置
      const packagingConfigs = db.prepare('SELECT id FROM packaging_configs WHERE model_id = ?').all(id);
      for (const config of packagingConfigs) {
        db.prepare('DELETE FROM process_configs WHERE packaging_config_id = ?').run(config.id);
      }
      db.prepare('DELETE FROM packaging_configs WHERE model_id = ?').run(id);
      
      // 最后删除型号本身
      db.prepare('DELETE FROM models WHERE id = ?').run(id);
    });
    
    return deleteTransaction();
  }

  // 检查型号是否被报价单使用
  static isUsedInQuotations(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE model_id = ?');
    const result = stmt.get(id);
    return result.count > 0;
  }
}

module.exports = Model;
