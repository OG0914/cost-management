/**
 * 报价单自定义费用数据模型
 * 用于存储管销后的自定义费用项（如关税、服务费等）
 * PostgreSQL 异步版本
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
   * @returns {Promise<number>} 新费用的 ID
   */
  static async create(data) {
    const result = await dbManager.query(
      `INSERT INTO quotation_custom_fees (
        quotation_id, fee_name, fee_rate, sort_order
      ) VALUES ($1, $2, $3, $4)
      RETURNING id`,
      [
        data.quotation_id,
        data.fee_name,
        data.fee_rate,
        data.sort_order || 0
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 批量创建自定义费用
   * @param {Array} fees - 费用数组
   * @returns {Promise<number>} 创建的费用数量
   */
  static async batchCreate(fees) {
    return await dbManager.transaction(async (client) => {
      for (const fee of fees) {
        await client.query(
          `INSERT INTO quotation_custom_fees (
            quotation_id, fee_name, fee_rate, sort_order
          ) VALUES ($1, $2, $3, $4)`,
          [
            fee.quotation_id,
            fee.fee_name,
            fee.fee_rate,
            fee.sort_order || 0
          ]
        );
      }
      return fees.length;
    });
  }

  /**
   * 根据 ID 查找费用
   * @param {number} id - 费用 ID
   * @returns {Promise<Object|null>} 费用对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM quotation_custom_fees WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据报价单 ID 查找所有自定义费用
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<Array>} 费用列表（按 sort_order 排序）
   */
  static async findByQuotationId(quotationId) {
    const result = await dbManager.query(
      `SELECT * FROM quotation_custom_fees 
       WHERE quotation_id = $1 
       ORDER BY sort_order, id`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * 更新费用
   * @param {number} id - 费用 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    const allowedFields = ['fee_name', 'fee_rate', 'sort_order'];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        paramIndex++;
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    // 添加更新时间
    fields.push('updated_at = NOW()');
    paramIndex++;
    values.push(id);

    const result = await dbManager.query(
      `UPDATE quotation_custom_fees 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    );

    return result.rowCount > 0;
  }

  /**
   * 删除费用
   * @param {number} id - 费用 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM quotation_custom_fees WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * 删除报价单的所有自定义费用
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteByQuotationId(quotationId) {
    const result = await dbManager.query(
      'DELETE FROM quotation_custom_fees WHERE quotation_id = $1',
      [quotationId]
    );
    return result.rowCount >= 0; // 即使没有费用也返回 true
  }

  /**
   * 替换报价单的所有自定义费用（先删除再批量创建）
   * @param {number} quotationId - 报价单 ID
   * @param {Array} fees - 新的费用列表
   * @returns {Promise<number>} 创建的费用数量
   */
  static async replaceByQuotationId(quotationId, fees) {
    return await dbManager.transaction(async (client) => {
      // 先删除现有费用
      await client.query(
        'DELETE FROM quotation_custom_fees WHERE quotation_id = $1',
        [quotationId]
      );
      
      // 如果有新费用，批量创建
      if (fees && fees.length > 0) {
        for (let index = 0; index < fees.length; index++) {
          const fee = fees[index];
          await client.query(
            `INSERT INTO quotation_custom_fees (
              quotation_id, fee_name, fee_rate, sort_order
            ) VALUES ($1, $2, $3, $4)`,
            [
              quotationId,
              fee.name || fee.fee_name,
              fee.rate || fee.fee_rate,
              fee.sort_order !== undefined ? fee.sort_order : index
            ]
          );
        }
        return fees.length;
      }
      return 0;
    });
  }
}

module.exports = QuotationCustomFee;
