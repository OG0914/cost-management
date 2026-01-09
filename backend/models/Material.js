/**
 * 原料数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class Material {
  /**
   * 获取所有原料
   * @returns {Promise<Array>} 原料列表
   */
  static async findAll() {
    const result = await dbManager.query(`
      SELECT * FROM materials
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * 根据厂商获取原料
   * @param {string} manufacturer - 厂商名称
   * @returns {Promise<Array>} 原料列表
   */
  static async findByManufacturer(manufacturer) {
    const result = await dbManager.query(
      `SELECT * FROM materials
       WHERE manufacturer = $1
       ORDER BY created_at DESC`,
      [manufacturer]
    );
    return result.rows;
  }

  /**
   * 根据 ID 查找原料
   * @param {number} id - 原料 ID
   * @returns {Promise<Object|null>} 原料对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM materials WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建原料
   * @param {Object} data - 原料数据
   * @returns {Promise<number>} 新原料的 ID
   */
  static async create(data) {
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = data;
    
    const result = await dbManager.query(
      `INSERT INTO materials (item_no, name, unit, price, currency, manufacturer, usage_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        item_no,
        name,
        unit,
        price,
        currency || 'CNY',
        manufacturer || null,
        usage_amount || null
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 批量创建原料
   * @param {Array} materials - 原料数据数组
   * @returns {Promise<number>} 插入的记录数
   */
  static async batchCreate(materials) {
    return await dbManager.transaction(async (client) => {
      let insertedCount = 0;
      
      for (const item of materials) {
        await client.query(
          `INSERT INTO materials (item_no, name, unit, price, currency, manufacturer, usage_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.item_no,
            item.name,
            item.unit,
            item.price,
            item.currency || 'CNY',
            item.manufacturer || null,
            item.usage_amount || null
          ]
        );
        insertedCount++;
      }
      
      return insertedCount;
    });
  }

  /**
   * 更新原料
   * @param {number} id - 原料 ID
   * @param {Object} data - 更新的数据
   * @param {number|null} userId - 操作用户 ID（用于记录价格历史）
   * @returns {Promise<Object>} 更新结果 { rowCount }
   */
  static async update(id, data, userId = null) {
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = data;
    
    // 记录价格历史
    const oldMaterial = await this.findById(id);
    if (oldMaterial && oldMaterial.price !== price && userId) {
      await this.recordPriceHistory(id, oldMaterial.price, price, userId);
    }
    
    const result = await dbManager.query(
      `UPDATE materials
       SET item_no = $1, name = $2, unit = $3, price = $4, currency = $5, 
           manufacturer = $6, usage_amount = $7, updated_at = NOW()
       WHERE id = $8`,
      [item_no, name, unit, price, currency, manufacturer, usage_amount, id]
    );
    
    return { rowCount: result.rowCount };
  }

  /**
   * 删除原料
   * @param {number} id - 原料 ID
   * @returns {Promise<Object>} 删除结果 { rowCount }
   */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM materials WHERE id = $1',
      [id]
    );
    return { rowCount: result.rowCount };
  }

  /**
   * 根据品号查找原料（用于导入时更新）
   * @param {string} itemNo - 品号
   * @returns {Promise<Object|null>} 原料对象或 null
   */
  static async findByItemNo(itemNo) {
    const result = await dbManager.query(
      'SELECT * FROM materials WHERE item_no = $1',
      [itemNo]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据多个品号批量查找原料
   * @param {Array<string>} itemNos - 品号数组
   * @returns {Promise<Array>} 原料列表
   */
  static async findByItemNos(itemNos) {
    if (!itemNos || itemNos.length === 0) return [];
    const placeholders = itemNos.map((_, i) => `$${i + 1}`).join(',');
    const result = await dbManager.query(`SELECT * FROM materials WHERE item_no IN (${placeholders})`, itemNos);
    return result.rows;
  }

  /**
   * 根据名称查找原料
   * @param {string} name - 原料名称
   * @returns {Promise<Object|null>} 原料对象或 null
   */
  static async findByName(name) {
    const result = await dbManager.query(
      'SELECT * FROM materials WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * 记录价格历史
   * @param {number} materialId - 原料 ID
   * @param {number} oldPrice - 旧价格
   * @param {number} newPrice - 新价格
   * @param {number} userId - 操作用户 ID
   * @returns {Promise<void>}
   */
  static async recordPriceHistory(materialId, oldPrice, newPrice, userId) {
    await dbManager.query(
      `INSERT INTO price_history (item_type, item_id, old_price, new_price, changed_by)
       VALUES ('material', $1, $2, $3, $4)`,
      [materialId, oldPrice, newPrice, userId]
    );
  }

  /**
   * 获取价格历史
   * @param {number} materialId - 原料 ID
   * @returns {Promise<Array>} 价格历史列表
   */
  static async getPriceHistory(materialId) {
    const result = await dbManager.query(
      `SELECT * FROM price_history
       WHERE item_type = 'material' AND item_id = $1
       ORDER BY changed_at DESC`,
      [materialId]
    );
    return result.rows;
  }
}

module.exports = Material;
