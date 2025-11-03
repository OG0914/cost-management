/**
 * 报价单明细数据模型
 */

const dbManager = require('../db/database');

class QuotationItem {
  /**
   * 创建报价单明细
   * @param {Object} data - 明细数据
   * @returns {number} 新明细的 ID
   */
  static create(data) {
    const db = dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO quotation_items (
        quotation_id, category, item_name, usage_amount, 
        unit_price, subtotal, is_changed, original_value, material_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.quotation_id,
      data.category,
      data.item_name,
      data.usage_amount,
      data.unit_price,
      data.subtotal,
      data.is_changed || 0,
      data.original_value || null,
      data.material_id || null
    );
    
    return result.lastInsertRowid;
  }

  /**
   * 批量创建报价单明细
   * @param {Array} items - 明细数组
   * @returns {number} 创建的明细数量
   */
  static batchCreate(items) {
    const db = dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO quotation_items (
        quotation_id, category, item_name, usage_amount, 
        unit_price, subtotal, is_changed, original_value, material_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((itemList) => {
      for (const item of itemList) {
        stmt.run(
          item.quotation_id,
          item.category,
          item.item_name,
          item.usage_amount,
          item.unit_price,
          item.subtotal,
          item.is_changed || 0,
          item.original_value || null,
          item.material_id || null
        );
      }
    });

    transaction(items);
    return items.length;
  }

  /**
   * 根据 ID 查找明细
   * @param {number} id - 明细 ID
   * @returns {Object|null} 明细对象
   */
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM quotation_items WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 根据报价单 ID 查找所有明细
   * @param {number} quotationId - 报价单 ID
   * @returns {Array} 明细列表
   */
  static findByQuotationId(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM quotation_items 
      WHERE quotation_id = ? 
      ORDER BY category, id
    `);
    return stmt.all(quotationId);
  }

  /**
   * 根据报价单 ID 和分类查找明细
   * @param {number} quotationId - 报价单 ID
   * @param {string} category - 分类（material/process/packaging）
   * @returns {Array} 明细列表
   */
  static findByQuotationIdAndCategory(quotationId, category) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM quotation_items 
      WHERE quotation_id = ? AND category = ?
      ORDER BY id
    `);
    return stmt.all(quotationId, category);
  }

  /**
   * 获取报价单明细的分组统计
   * @param {number} quotationId - 报价单 ID
   * @returns {Object} 分组统计数据
   */
  static getGroupedByCategory(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        category,
        COUNT(*) as item_count,
        SUM(subtotal) as category_total
      FROM quotation_items
      WHERE quotation_id = ?
      GROUP BY category
    `);
    
    const results = stmt.all(quotationId);
    
    // 转换为对象格式
    const grouped = {
      material: { items: [], total: 0, count: 0 },
      process: { items: [], total: 0, count: 0 },
      packaging: { items: [], total: 0, count: 0 }
    };

    results.forEach(row => {
      grouped[row.category] = {
        total: row.category_total,
        count: row.item_count
      };
    });

    // 获取每个分类的明细
    ['material', 'process', 'packaging'].forEach(category => {
      grouped[category].items = this.findByQuotationIdAndCategory(quotationId, category);
    });

    return grouped;
  }

  /**
   * 更新明细
   * @param {number} id - 明细 ID
   * @param {Object} data - 更新的数据
   * @returns {boolean} 是否更新成功
   */
  static update(id, data) {
    const db = dbManager.getDatabase();
    
    const fields = [];
    const values = [];

    const allowedFields = [
      'item_name', 'usage_amount', 'unit_price', 
      'subtotal', 'is_changed', 'original_value', 'material_id'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE quotation_items 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * 删除明细
   * @param {number} id - 明细 ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM quotation_items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 删除报价单的所有明细
   * @param {number} quotationId - 报价单 ID
   * @returns {boolean} 是否删除成功
   */
  static deleteByQuotationId(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?');
    const result = stmt.run(quotationId);
    return result.changes > 0;
  }

  /**
   * 获取修改项列表
   * @param {number} quotationId - 报价单 ID
   * @returns {Array} 修改项列表
   */
  static getChangedItems(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM quotation_items 
      WHERE quotation_id = ? AND is_changed = 1
      ORDER BY category, id
    `);
    return stmt.all(quotationId);
  }

  /**
   * 计算报价单明细总计
   * @param {number} quotationId - 报价单 ID
   * @returns {Object} 总计数据
   */
  static calculateTotals(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN category = 'material' THEN subtotal ELSE 0 END) as material_total,
        SUM(CASE WHEN category = 'process' THEN subtotal ELSE 0 END) as process_total,
        SUM(CASE WHEN category = 'packaging' THEN subtotal ELSE 0 END) as packaging_total,
        SUM(subtotal) as grand_total
      FROM quotation_items
      WHERE quotation_id = ?
    `);
    return stmt.get(quotationId);
  }

  /**
   * 标记明细为已修改
   * @param {number} id - 明细 ID
   * @param {number} originalValue - 原始值
   * @returns {boolean} 是否更新成功
   */
  static markAsChanged(id, originalValue) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE quotation_items 
      SET is_changed = 1, original_value = ?
      WHERE id = ?
    `);
    const result = stmt.run(originalValue, id);
    return result.changes > 0;
  }

  /**
   * 取消修改标记
   * @param {number} id - 明细 ID
   * @returns {boolean} 是否更新成功
   */
  static unmarkAsChanged(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      UPDATE quotation_items 
      SET is_changed = 0, original_value = NULL
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

module.exports = QuotationItem;
