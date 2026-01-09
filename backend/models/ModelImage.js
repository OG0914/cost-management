/** 型号图片数据模型 */
const dbManager = require('../db/database');

class ModelImage {
  /** 根据型号ID获取所有图片 */
  static async findByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT * FROM model_images WHERE model_id = $1 ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [modelId]
    );
    return result.rows;
  }

  /** 获取型号主图 */
  static async findPrimaryByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT * FROM model_images WHERE model_id = $1 AND is_primary = true LIMIT 1`,
      [modelId]
    );
    return result.rows[0] || null;
  }

  /** 根据ID查找图片 */
  static async findById(id) {
    const result = await dbManager.query(`SELECT * FROM model_images WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /** 创建图片记录 */
  static async create(data) {
    const { model_id, file_name, file_path, file_size, is_primary = false, sort_order = 0 } = data;
    const result = await dbManager.query(
      `INSERT INTO model_images (model_id, file_name, file_path, file_size, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [model_id, file_name, file_path, file_size, is_primary, sort_order]
    );
    return result.rows[0];
  }

  /** 设置主图（同时取消其他主图） */
  static async setPrimary(modelId, imageId) {
    await dbManager.transaction(async (client) => {
      await client.query(`UPDATE model_images SET is_primary = false WHERE model_id = $1`, [modelId]);
      await client.query(`UPDATE model_images SET is_primary = true WHERE id = $1 AND model_id = $2`, [imageId, modelId]);
    });
  }

  /** 删除图片记录 */
  static async delete(id) {
    const result = await dbManager.query(`DELETE FROM model_images WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }

  /** 检查型号是否有主图 */
  static async hasPrimary(modelId) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count FROM model_images WHERE model_id = $1 AND is_primary = true`,
      [modelId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /** 获取型号图片数量 */
  static async countByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count FROM model_images WHERE model_id = $1`,
      [modelId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = ModelImage;
