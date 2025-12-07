/**
 * 包材数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class PackagingMaterial {
  /**
   * 根据包装配置ID获取包材列表
   * @param {number} packagingConfigId - 包装配置 ID
   * @returns {Promise<Array>} 包材列表
   */
  static async findByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query(
      `SELECT * FROM packaging_materials
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [packagingConfigId]
    );
    return result.rows;
  }

  /**
   * 根据ID查找包材
   * @param {number} id - 包材 ID
   * @returns {Promise<Object|null>} 包材对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM packaging_materials WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建包材
   * @param {Object} data - 包材数据
   * @returns {Promise<number>} 新包材的 ID
   */
  static async create(data) {
    const { packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order } = data;
    
    const result = await dbManager.query(
      `INSERT INTO packaging_materials (packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        packaging_config_id, 
        material_name, 
        basic_usage, 
        unit_price, 
        carton_volume || null, 
        sort_order || 0
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 批量创建包材
   * @param {number} packagingConfigId - 包装配置 ID
   * @param {Array} materials - 包材数组
   * @returns {Promise<number>} 创建的包材数量
   */
  static async createBatch(packagingConfigId, materials) {
    return await dbManager.transaction(async (client) => {
      for (const material of materials) {
        await client.query(
          `INSERT INTO packaging_materials (packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            packagingConfigId,
            material.material_name,
            material.basic_usage,
            material.unit_price,
            material.carton_volume || null,
            material.sort_order || 0
          ]
        );
      }
      return materials.length;
    });
  }

  /**
   * 更新包材
   * @param {number} id - 包材 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async update(id, data) {
    const { material_name, basic_usage, unit_price, carton_volume, sort_order, is_active } = data;
    
    const result = await dbManager.query(
      `UPDATE packaging_materials
       SET material_name = $1, basic_usage = $2, unit_price = $3, carton_volume = $4, 
           sort_order = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7`,
      [
        material_name, 
        basic_usage, 
        unit_price, 
        carton_volume || null, 
        sort_order || 0, 
        is_active !== undefined ? is_active : true, 
        id
      ]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除包材（软删除）
   * @param {number} id - 包材 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async delete(id) {
    const result = await dbManager.query(
      `UPDATE packaging_materials
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 根据包装配置ID删除所有包材
   * @param {number} packagingConfigId - 包装配置 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async deleteByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query(
      'DELETE FROM packaging_materials WHERE packaging_config_id = $1',
      [packagingConfigId]
    );
    return { rowCount: result.rowCount };
  }
}

module.exports = PackagingMaterial;
