/**
 * 标准成本数据模型 - PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class StandardCost {
  /** 获取所有当前版本的标准成本（支持分页） */
  static async findAllCurrent(options = {}) {
    const { model_category, model_name, keyword, page = 1, pageSize = 20 } = options;
    const params = [];
    let paramIndex = 0;
    let whereClause = 'WHERE sc.is_current = true';

    if (model_category) {
      paramIndex++;
      whereClause += ` AND m.model_category = $${paramIndex}`;
      params.push(model_category);
    }
    if (model_name) {
      paramIndex++;
      whereClause += ` AND m.model_name ILIKE $${paramIndex}`;
      params.push(`%${model_name}%`);
    }
    if (keyword && keyword.trim()) {
      paramIndex++;
      const kw = `$${paramIndex}`;
      whereClause += ` AND (m.model_name ILIKE ${kw} OR pc.config_name ILIKE ${kw} OR q.quotation_no ILIKE ${kw})`;
      params.push(`%${keyword.trim()}%`);
    }

    const baseQuery = `
      FROM standard_costs sc
      JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
      JOIN models m ON pc.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      JOIN users u ON sc.set_by = u.id
      LEFT JOIN quotations q ON sc.quotation_id = q.id
      ${whereClause}`;

    const countResult = await dbManager.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * pageSize;
    const dataParams = [...params, pageSize, offset];
    const dataResult = await dbManager.query(`
      SELECT sc.*, pc.config_name as packaging_config_name, pc.packaging_type, pc.layer1_qty, pc.layer2_qty, pc.layer3_qty,
             pc.pc_per_bag, pc.bags_per_box, pc.boxes_per_carton, m.model_name, m.model_category, r.name as regulation_name,
             u.real_name as setter_name, q.quotation_no
      ${baseQuery}
      ORDER BY sc.created_at DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`, dataParams);

    return { data: dataResult.rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** 根据ID查找标准成本 */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT sc.*, pc.config_name as packaging_config_name, pc.pc_per_bag, pc.bags_per_box, pc.boxes_per_carton,
              pc.model_id, m.model_name, m.model_category, m.regulation_id, r.name as regulation_name, u.real_name as setter_name
       FROM standard_costs sc
       JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
       JOIN models m ON pc.model_id = m.id
       JOIN regulations r ON m.regulation_id = r.id
       JOIN users u ON sc.set_by = u.id
       WHERE sc.id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  /** 根据包装配置ID查找当前标准成本 */
  static async findCurrentByPackagingConfigId(packagingConfigId, salesType = null) {
    const sql = salesType
      ? `SELECT * FROM standard_costs WHERE packaging_config_id = $1 AND sales_type = $2 AND is_current = true`
      : `SELECT * FROM standard_costs WHERE packaging_config_id = $1 AND is_current = true`;
    const params = salesType ? [packagingConfigId, salesType] : [packagingConfigId];
    const result = await dbManager.query(sql, params);
    return result.rows[0] || null;
  }

  /** 获取标准成本的所有历史版本 */
  static async getHistory(packagingConfigId, salesType = null) {
    const sql = salesType
      ? `SELECT sc.*, u.real_name as setter_name FROM standard_costs sc JOIN users u ON sc.set_by = u.id WHERE sc.packaging_config_id = $1 AND sc.sales_type = $2 ORDER BY sc.version DESC`
      : `SELECT sc.*, u.real_name as setter_name FROM standard_costs sc JOIN users u ON sc.set_by = u.id WHERE sc.packaging_config_id = $1 ORDER BY sc.version DESC`;
    const params = salesType ? [packagingConfigId, salesType] : [packagingConfigId];
    const result = await dbManager.query(sql, params);
    return result.rows;
  }

  /** 获取指定包装配置和销售类型的最大版本号 */
  static async getMaxVersion(packagingConfigId, salesType) {
    const result = await dbManager.query(
      `SELECT MAX(version) as max_version FROM standard_costs WHERE packaging_config_id = $1 AND sales_type = $2`,
      [packagingConfigId, salesType]
    );
    return result.rows[0].max_version || 0;
  }

  /** 创建标准成本（从报价单） */
  static async create(data) {
    return await dbManager.transaction(async (client) => {
      const maxVersionResult = await client.query(
        `SELECT MAX(version) as max_version FROM standard_costs WHERE packaging_config_id = $1 AND sales_type = $2`,
        [data.packaging_config_id, data.sales_type]
      );
      const maxVersion = maxVersionResult.rows[0].max_version || 0;
      const newVersion = maxVersion + 1;

      if (maxVersion > 0) {
        await client.query(
          `UPDATE standard_costs SET is_current = false WHERE packaging_config_id = $1 AND sales_type = $2`,
          [data.packaging_config_id, data.sales_type]
        );
      }

      const insertResult = await client.query(
        `INSERT INTO standard_costs (packaging_config_id, quotation_id, version, is_current, base_cost, overhead_price, domestic_price, export_price, quantity, currency, sales_type, set_by)
         VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [data.packaging_config_id, data.quotation_id, newVersion, data.base_cost, data.overhead_price,
         data.domestic_price || null, data.export_price || null, data.quantity, data.currency || 'CNY', data.sales_type, data.set_by]
      );
      return insertResult.rows[0].id;
    });
  }

  /** 恢复历史版本 */
  static async restore(packagingConfigId, salesType, version, setBy) {
    const result = await dbManager.query(
      `SELECT * FROM standard_costs WHERE packaging_config_id = $1 AND sales_type = $2 AND version = $3`,
      [packagingConfigId, salesType, version]
    );
    const oldVersion = result.rows[0];
    if (!oldVersion) throw new Error('历史版本不存在');

    return await this.create({
      packaging_config_id: oldVersion.packaging_config_id, quotation_id: oldVersion.quotation_id,
      base_cost: oldVersion.base_cost, overhead_price: oldVersion.overhead_price,
      domestic_price: oldVersion.domestic_price, export_price: oldVersion.export_price,
      quantity: oldVersion.quantity, currency: oldVersion.currency, sales_type: oldVersion.sales_type, set_by: setBy
    });
  }

  /** 删除指定包装配置的所有标准成本版本 */
  static async deleteByPackagingConfigId(packagingConfigId) {
    const result = await dbManager.query('DELETE FROM standard_costs WHERE packaging_config_id = $1', [packagingConfigId]);
    return result.rowCount > 0;
  }

  /** 根据报价单ID查找标准成本 */
  static async findByQuotationId(quotationId) {
    const result = await dbManager.query(`SELECT * FROM standard_costs WHERE quotation_id = $1 AND is_current = true`, [quotationId]);
    return result.rows[0] || null;
  }
}

module.exports = StandardCost;
