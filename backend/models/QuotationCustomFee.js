/**
 * 报价单自定义费用数据模型
 * 用于存储管销后的自定义费用项（如关税、服务费等）
 */

const dbManager = require('../db/database');

class QuotationCustomFee {
  /**
   * 创建自定义费用
   * @param {Object} data - 费用数据
   * @param {number} data.quotation_id - 报价单ID
   * @param {string} data.fee_name - 费用名称
   * @param {number} data.fee_rate - 费率（小数，如0.04表示4%）
   * @param {number} data.sort_order - 排序顺序
   * @returns {number} 新费用的 ID
   */
  static create(data) {
    const db = dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO quotation_custom_fees (
        quotation_id, fee_name, fee_rate, sort_order
      ) VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.quotation_id,
      data.fee_name,
      data.fee_rate,
      data.sort_order || 0
    );
    
    return result.lastInsertRowid;
  }

  /**
   * 批量创建自定义费用
   * @param {Array} fees - 费用数组
   * @returns {number} 创建的费用数量
   */
  static batchCreate(fees) {
    const db = dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO quotation_custom_fees (
        quotation_id, fee_name, fee_rate, sort_order
      ) VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((feeList) => {
      for (const fee of feeList) {
        stmt.run(
          fee.quotation_id,
          fee.fee_name,
          fee.fee_rate,
          fee.sort_order || 0
        );
      }
    });

    transaction(fees);
    return fees.length;
  }

  /**
   * 根据 ID 查找费用
   * @param {number} id - 费用 ID
   * @returns {Object|null} 费用对象
   */
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM quotation_custom_fees WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 根据报价单 ID 查找所有自定义费用
   * @param {number} quotationId - 报价单 ID
   * @returns {Array} 费用列表（按 sort_order 排序）
   */
  static findByQuotationId(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM quotation_custom_fees 
      WHERE quotation_id = ? 
      ORDER BY sort_order, id
    `);
    return stmt.all(quotationId);
  }

  /**
   * 更新费用
   * @param {number} id - 费用 ID
   * @param {Object} data - 更新的数据
   * @returns {boolean} 是否更新成功
   */
  static update(id, data) {
    const db = dbManager.getDatabase();
    
    const fields = [];
    const values = [];

    const allowedFields = ['fee_name', 'fee_rate', 'sort_order'];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    // 添加更新时间
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE quotation_custom_fees 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * 删除费用
   * @param {number} id - 费用 ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM quotation_custom_fees WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 删除报价单的所有自定义费用
   * @param {number} quotationId - 报价单 ID
   * @returns {boolean} 是否删除成功
   */
  static deleteByQuotationId(quotationId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('DELETE FROM quotation_custom_fees WHERE quotation_id = ?');
    const result = stmt.run(quotationId);
    return result.changes >= 0; // 即使没有费用也返回 true
  }

  /**
   * 替换报价单的所有自定义费用（先删除再批量创建）
   * @param {number} quotationId - 报价单 ID
   * @param {Array} fees - 新的费用列表
   * @returns {number} 创建的费用数量
   */
  static replaceByQuotationId(quotationId, fees) {
    const db = dbManager.getDatabase();
    
    const transaction = db.transaction(() => {
      // 先删除现有费用
      this.deleteByQuotationId(quotationId);
      
      // 如果有新费用，批量创建
      if (fees && fees.length > 0) {
        const feesWithQuotationId = fees.map((fee, index) => ({
          quotation_id: quotationId,
          fee_name: fee.name || fee.fee_name,
          fee_rate: fee.rate || fee.fee_rate,
          sort_order: fee.sort_order !== undefined ? fee.sort_order : index
        }));
        return this.batchCreate(feesWithQuotationId);
      }
      return 0;
    });

    return transaction();
  }
}

module.exports = QuotationCustomFee;
