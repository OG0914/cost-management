/**
 * 报价单主表数据模型
 */

const dbManager = require('../db/database');
const QueryBuilder = require('../utils/queryBuilder');

class Quotation {
  /**
   * 创建报价单
   * @param {Object} data - 报价单数据
   * @returns {number} 新报价单的 ID
   */
  static create(data) {
    const db = dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO quotations (
        quotation_no, customer_name, customer_region, model_id, regulation_id,
        quantity, freight_total, freight_per_unit, sales_type, shipping_method, port,
        base_cost, overhead_price, final_price, currency, status, created_by, 
        packaging_config_id, include_freight_in_base, custom_profit_tiers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.quotation_no,
      data.customer_name,
      data.customer_region,
      data.model_id,
      data.regulation_id,
      data.quantity,
      data.freight_total,
      data.freight_per_unit,
      data.sales_type,
      data.shipping_method || null,
      data.port || null,
      data.base_cost,
      data.overhead_price,
      data.final_price,
      data.currency || 'CNY',
      data.status || 'draft',
      data.created_by,
      data.packaging_config_id || null,
      data.include_freight_in_base !== false ? 1 : 0,
      data.custom_profit_tiers || null
    );
    
    return result.lastInsertRowid;
  }

  /**
   * 根据 ID 查找报价单
   * @param {number} id - 报价单 ID
   * @returns {Object|null} 报价单对象
   */
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT q.*, 
             r.name as regulation_name,
             m.model_name,
             pc.config_name as packaging_config_name,
             pc.pc_per_bag,
             pc.bags_per_box,
             pc.boxes_per_carton,
             u1.real_name as creator_name,
             u2.real_name as reviewer_name
      FROM quotations q
      LEFT JOIN regulations r ON q.regulation_id = r.id
      LEFT JOIN models m ON q.model_id = m.id
      LEFT JOIN packaging_configs pc ON q.packaging_config_id = pc.id
      LEFT JOIN users u1 ON q.created_by = u1.id
      LEFT JOIN users u2 ON q.reviewed_by = u2.id
      WHERE q.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * 根据报价单编号查找
   * @param {string} quotationNo - 报价单编号
   * @returns {Object|null} 报价单对象
   */
  static findByQuotationNo(quotationNo) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM quotations WHERE quotation_no = ?');
    return stmt.get(quotationNo);
  }

  /**
   * 查找所有报价单（支持筛选和分页）
   * @param {Object} options - 查询选项
   * @returns {Object} { data: [], total: number }
   */
  static findAll(options = {}) {
    const db = dbManager.getDatabase();
    const {
      status,
      customer_name,
      model_name,
      model_id,
      created_by,
      date_from,
      date_to,
      page = 1,
      pageSize = 20
    } = options;

    // 使用查询构建器构建查询
    const builder = new QueryBuilder('quotations q')
      .leftJoin('regulations r', 'q.regulation_id = r.id')
      .leftJoin('models m', 'q.model_id = m.id')
      .leftJoin('packaging_configs pc', 'q.packaging_config_id = pc.id')
      .leftJoin('users u1', 'q.created_by = u1.id')
      .leftJoin('users u2', 'q.reviewed_by = u2.id');

    // 动态添加查询条件
    if (status) {
      builder.where('q.status', '=', status);
    }

    if (customer_name) {
      builder.whereLike('q.customer_name', customer_name);
    }

    if (model_name) {
      builder.whereLike('m.model_name', model_name);
    }

    if (model_id) {
      builder.where('q.model_id', '=', model_id);
    }

    if (created_by) {
      builder.where('q.created_by', '=', created_by);
    }

    if (date_from) {
      builder.whereDate('q.created_at', '>=', date_from);
    }

    if (date_to) {
      builder.whereDate('q.created_at', '<=', date_to);
    }

    // 查询总数
    const countQuery = builder.buildCount();
    const countStmt = db.prepare(countQuery.sql);
    const { total } = countStmt.get(...countQuery.params);

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataQuery = builder
      .orderByDesc('q.created_at')
      .limit(pageSize)
      .offset(offset)
      .buildSelect(`
        q.*, 
        r.name as regulation_name,
        m.model_name,
        pc.config_name as packaging_config_name,
        pc.pc_per_bag,
        pc.bags_per_box,
        pc.boxes_per_carton,
        u1.real_name as creator_name,
        u2.real_name as reviewer_name
      `);

    const dataStmt = db.prepare(dataQuery.sql);
    const data = dataStmt.all(...dataQuery.params);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 更新报价单
   * @param {number} id - 报价单 ID
   * @param {Object} data - 更新的数据
   * @returns {boolean} 是否更新成功
   */
  static update(id, data) {
    const db = dbManager.getDatabase();
    
    const fields = [];
    const values = [];

    // 动态构建更新字段
    const allowedFields = [
      'customer_name', 'customer_region', 'model_id', 'regulation_id',
      'quantity', 'freight_total', 'freight_per_unit', 'sales_type',
      'shipping_method', 'port',
      'base_cost', 'overhead_price', 'final_price', 'currency', 
      'packaging_config_id', 'include_freight_in_base', 'custom_profit_tiers'
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

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE quotations 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * 更新报价单状态
   * @param {number} id - 报价单 ID
   * @param {string} status - 新状态
   * @param {number} reviewedBy - 审核人 ID（可选）
   * @returns {boolean} 是否更新成功
   */
  static updateStatus(id, status, reviewedBy = null) {
    const db = dbManager.getDatabase();
    
    let sql = 'UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [status];

    if (status === 'submitted') {
      sql += ', submitted_at = CURRENT_TIMESTAMP';
    }

    if (status === 'approved' || status === 'rejected') {
      sql += ', reviewed_at = CURRENT_TIMESTAMP';
      if (reviewedBy) {
        sql += ', reviewed_by = ?';
        params.push(reviewedBy);
      }
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result.changes > 0;
  }

  /**
   * 删除报价单
   * @param {number} id - 报价单 ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = dbManager.getDatabase();
    
    // 使用事务删除报价单及其明细
    const transaction = db.transaction(() => {
      // 删除明细
      const deleteItemsStmt = db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?');
      deleteItemsStmt.run(id);
      
      // 删除主表
      const deleteQuotationStmt = db.prepare('DELETE FROM quotations WHERE id = ?');
      deleteQuotationStmt.run(id);
    });

    try {
      transaction();
      return true;
    } catch (error) {
      console.error('删除报价单失败:', error);
      return false;
    }
  }

  /**
   * 生成报价单编号
   * 格式：MK+日期+流水号，如 MK20251029-001
   * @returns {string} 报价单编号
   */
  static generateQuotationNo() {
    const db = dbManager.getDatabase();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 查询今天最大的流水号
    const stmt = db.prepare(`
      SELECT quotation_no 
      FROM quotations 
      WHERE quotation_no LIKE ?
      ORDER BY quotation_no DESC
      LIMIT 1
    `);
    const result = stmt.get(`MK${dateStr}-%`);
    
    let serial = 1;
    if (result && result.quotation_no) {
      // 从最后一个编号中提取流水号并加1
      const lastSerial = parseInt(result.quotation_no.split('-')[1]);
      serial = lastSerial + 1;
    }
    
    // 循环检查编号是否存在，直到找到未使用的编号
    let quotationNo = `MK${dateStr}-${String(serial).padStart(3, '0')}`;
    while (this.exists(quotationNo)) {
      serial++;
      quotationNo = `MK${dateStr}-${String(serial).padStart(3, '0')}`;
    }
    
    return quotationNo;
  }

  /**
   * 检查报价单编号是否存在
   * @param {string} quotationNo - 报价单编号
   * @returns {boolean} 是否存在
   */
  static exists(quotationNo) {
    const quotation = this.findByQuotationNo(quotationNo);
    return quotation !== null && quotation !== undefined;
  }

  /**
   * 获取用户的报价单统计
   * @param {number} userId - 用户 ID
   * @returns {Object} 统计数据
   */
  static getStatsByUser(userId) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM quotations
      WHERE created_by = ?
    `);
    return stmt.get(userId);
  }

  /**
   * 获取待审核的报价单列表
   * @returns {Array} 报价单列表
   */
  static getPendingReview() {
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      SELECT q.*, 
             r.name as regulation_name,
             m.model_name,
             u.real_name as creator_name
      FROM quotations q
      LEFT JOIN regulations r ON q.regulation_id = r.id
      LEFT JOIN models m ON q.model_id = m.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.status = 'submitted'
      ORDER BY q.submitted_at ASC
    `);
    return stmt.all();
  }
}

module.exports = Quotation;
