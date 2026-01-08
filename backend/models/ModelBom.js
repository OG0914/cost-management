/** 产品BOM数据模型 - PostgreSQL异步版本 */

const dbManager = require('../db/database');

class ModelBom {
  /** 根据型号ID获取BOM清单（JOIN原料表获取最新单价） */
  static async findByModelId(modelId) {
    const result = await dbManager.query(`
      SELECT b.id, b.model_id, b.material_id, b.usage_amount, b.sort_order, b.is_active,
             m.item_no, m.name as material_name, m.unit, m.price as unit_price, m.currency, m.manufacturer
      FROM model_bom_materials b
      JOIN materials m ON b.material_id = m.id
      WHERE b.model_id = $1 AND b.is_active = true
      ORDER BY b.sort_order, b.id
    `, [modelId]);
    return result.rows;
  }

  /** 根据ID查找BOM记录 */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM model_bom_materials WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /** 检查原料是否已存在于型号BOM中 */
  static async existsInModel(modelId, materialId) {
    const result = await dbManager.query(
      'SELECT id FROM model_bom_materials WHERE model_id = $1 AND material_id = $2',
      [modelId, materialId]
    );
    return result.rows.length > 0;
  }

  /** 创建BOM原料项 */
  static async create(data) {
    const { model_id, material_id, usage_amount, sort_order } = data;
    const result = await dbManager.query(
      `INSERT INTO model_bom_materials (model_id, material_id, usage_amount, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [model_id, material_id, usage_amount, sort_order || 0]
    );
    return result.rows[0].id;
  }

  /** 更新BOM原料项 */
  static async update(id, data) {
    const { usage_amount, sort_order, is_active } = data;
    const result = await dbManager.query(
      `UPDATE model_bom_materials 
       SET usage_amount = COALESCE($1, usage_amount),
           sort_order = COALESCE($2, sort_order),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4`,
      [usage_amount, sort_order, is_active, id]
    );
    return { rowCount: result.rowCount };
  }

  /** 删除BOM原料项 */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM model_bom_materials WHERE id = $1',
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /** 批量更新BOM（用于排序调整） */
  static async batchUpdate(modelId, items) {
    return await dbManager.transaction(async (client) => {
      for (const item of items) {
        await client.query(
          `UPDATE model_bom_materials SET usage_amount = $1, sort_order = $2, updated_at = NOW()
           WHERE id = $3 AND model_id = $4`,
          [item.usage_amount, item.sort_order, item.id, modelId]
        );
      }
      return items.length;
    });
  }

  /** 检查原料是否被BOM引用 */
  static async isMaterialUsed(materialId) {
    const result = await dbManager.query(
      'SELECT COUNT(*) as count FROM model_bom_materials WHERE material_id = $1',
      [materialId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /** 获取引用某原料的型号列表 */
  static async getModelsByMaterial(materialId) {
    const result = await dbManager.query(`
      SELECT DISTINCT m.id, m.model_name, r.name as regulation_name
      FROM model_bom_materials b
      JOIN models m ON b.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      WHERE b.material_id = $1
    `, [materialId]);
    return result.rows;
  }

  /** 复制BOM到目标型号 - mode: 'replace'替换 | 'merge'合并 */
  static async copyBom(sourceModelId, targetModelId, mode = 'replace') {
    return await dbManager.transaction(async (client) => {
      const sourceResult = await client.query( // 获取源型号BOM
        'SELECT material_id, usage_amount, sort_order FROM model_bom_materials WHERE model_id = $1 AND is_active = true ORDER BY sort_order',
        [sourceModelId]
      );
      if (sourceResult.rows.length === 0) throw new Error('源型号没有BOM数据');

      if (mode === 'replace') { // 替换模式：删除目标型号现有BOM
        await client.query('DELETE FROM model_bom_materials WHERE model_id = $1', [targetModelId]);
      }

      let copiedCount = 0, skippedCount = 0;
      for (const item of sourceResult.rows) {
        if (mode === 'merge') { // 合并模式：检查是否已存在
          const exists = await client.query(
            'SELECT id FROM model_bom_materials WHERE model_id = $1 AND material_id = $2',
            [targetModelId, item.material_id]
          );
          if (exists.rows.length > 0) { skippedCount++; continue; }
        }
        await client.query(
          'INSERT INTO model_bom_materials (model_id, material_id, usage_amount, sort_order) VALUES ($1, $2, $3, $4)',
          [targetModelId, item.material_id, item.usage_amount, item.sort_order]
        );
        copiedCount++;
      }
      return { copiedCount, skippedCount, totalSource: sourceResult.rows.length };
    });
  }

  /** 从Excel导入BOM */
  static async importBom(modelId, bomMap, materialMap, mode = 'replace') {
    return await dbManager.transaction(async (client) => {
      if (mode === 'replace') {
        await client.query('DELETE FROM model_bom_materials WHERE model_id = $1', [modelId]);
      }

      let created = 0, updated = 0, skipped = 0;
      let sortOrder = 0;

      for (const [itemNo, data] of bomMap) {
        const material = materialMap.get(itemNo);
        if (!material) { skipped++; continue; } // 原料不存在，跳过

        if (mode === 'merge') {
          const exists = await client.query('SELECT id FROM model_bom_materials WHERE model_id = $1 AND material_id = $2', [modelId, material.id]);
          if (exists.rows.length > 0) {
            await client.query('UPDATE model_bom_materials SET usage_amount = $1, updated_at = NOW() WHERE id = $2', [data.usageAmount, exists.rows[0].id]);
            updated++;
            continue;
          }
        }

        await client.query('INSERT INTO model_bom_materials (model_id, material_id, usage_amount, sort_order) VALUES ($1, $2, $3, $4)', [modelId, material.id, data.usageAmount, sortOrder++]);
        created++;
      }

      return { created, updated, skipped };
    });
  }
}

module.exports = ModelBom;
