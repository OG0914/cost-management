/**
 * 报价单主表数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');
const QueryBuilder = require('../utils/queryBuilder');

class Quotation {
  /**
   * 创建报价单
   * @param {Object} data - 报价单数据
   * @returns {Promise<number>} 新报价单的 ID
   */
  static async create(data) {
    const result = await dbManager.query(
      `INSERT INTO quotations (
        quotation_no, customer_name, customer_region, model_id, regulation_id,
        quantity, freight_total, freight_per_unit, sales_type, shipping_method, port,
        base_cost, overhead_price, final_price, currency, status, created_by, 
        packaging_config_id, include_freight_in_base, custom_profit_tiers, vat_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id`,
      [
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
        data.include_freight_in_base !== false,
        data.custom_profit_tiers || null,
        data.vat_rate !== undefined ? data.vat_rate : null
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 根据 ID 查找报价单
   * @param {number} id - 报价单 ID
   * @returns {Promise<Object|null>} 报价单对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      `SELECT q.*, 
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
      WHERE q.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }


  /**
   * 根据报价单编号查找
   * @param {string} quotationNo - 报价单编号
   * @returns {Promise<Object|null>} 报价单对象或 null
   */
  static async findByQuotationNo(quotationNo) {
    const result = await dbManager.query(
      'SELECT * FROM quotations WHERE quotation_no = $1',
      [quotationNo]
    );
    return result.rows[0] || null;
  }

  /**
   * 查找所有报价单（支持筛选和分页）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} { data: [], total: number }
   */
  static async findAll(options = {}) {
    const {
      status,
      keyword, // 新增：多字段搜索
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
      .leftJoin('users u2', 'q.reviewed_by = u2.id')
      .leftJoin('standard_costs sc', 'q.id = sc.quotation_id AND sc.is_current = true');

    // 动态添加查询条件
    if (status) {
      builder.where('q.status', '=', status);
    }

    // 关键词搜索（报价单编号、客户名称、型号）
    if (keyword && keyword.trim()) {
      builder.whereLikeOr(['q.quotation_no', 'q.customer_name', 'm.model_name'], keyword);
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
    const countResult = await dbManager.query(countQuery.sql, countQuery.params);
    const total = parseInt(countResult.rows[0].total);

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
        m.model_category,
        pc.config_name as packaging_config_name,
        pc.packaging_type,
        pc.layer1_qty,
        pc.layer2_qty,
        pc.layer3_qty,
        pc.pc_per_bag,
        pc.bags_per_box,
        pc.boxes_per_carton,
        u1.real_name as creator_name,
        u2.real_name as reviewer_name,
        CASE WHEN sc.id IS NOT NULL THEN true ELSE false END as is_standard_cost
      `);

    const dataResult = await dbManager.query(dataQuery.sql, dataQuery.params);

    return {
      data: dataResult.rows,
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
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    // 动态构建更新字段
    const allowedFields = [
      'customer_name', 'customer_region', 'model_id', 'regulation_id',
      'quantity', 'freight_total', 'freight_per_unit', 'sales_type',
      'shipping_method', 'port',
      'base_cost', 'overhead_price', 'final_price', 'currency', 
      'packaging_config_id', 'include_freight_in_base', 'custom_profit_tiers',
      'vat_rate'
    ];

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

    fields.push('updated_at = NOW()');
    paramIndex++;
    values.push(id);

    const result = await dbManager.query(
      `UPDATE quotations 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    );

    return result.rowCount > 0;
  }


  /**
   * 更新报价单状态
   * @param {number} id - 报价单 ID
   * @param {string} status - 新状态
   * @param {number} reviewedBy - 审核人 ID（可选）
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateStatus(id, status, reviewedBy = null) {
    let sql = 'UPDATE quotations SET status = $1, updated_at = NOW()';
    let params = [status];
    let paramIndex = 1;

    if (status === 'submitted') {
      sql += ', submitted_at = NOW()';
    }

    if (status === 'approved' || status === 'rejected') {
      sql += ', reviewed_at = NOW()';
      if (reviewedBy) {
        paramIndex++;
        sql += `, reviewed_by = $${paramIndex}`;
        params.push(reviewedBy);
      }
    }

    paramIndex++;
    sql += ` WHERE id = $${paramIndex}`;
    params.push(id);

    const result = await dbManager.query(sql, params);
    return result.rowCount > 0;
  }

  /**
   * 删除报价单
   * @param {number} id - 报价单 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    try {
      await dbManager.transaction(async (client) => {
        // 删除明细（由于有 ON DELETE CASCADE，这步可选，但显式删除更安全）
        await client.query(
          'DELETE FROM quotation_items WHERE quotation_id = $1',
          [id]
        );
        
        // 删除自定义费用
        await client.query(
          'DELETE FROM quotation_custom_fees WHERE quotation_id = $1',
          [id]
        );
        
        // 删除主表
        await client.query(
          'DELETE FROM quotations WHERE id = $1',
          [id]
        );
      });
      return true;
    } catch (error) {
      console.error('删除报价单失败:', error);
      return false;
    }
  }

  /**
   * 生成报价单编号
   * 格式：MK+日期+流水号，如 MK20251029-001
   * @returns {Promise<string>} 报价单编号
   */
  static async generateQuotationNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 查询今天最大的流水号
    const result = await dbManager.query(
      `SELECT quotation_no 
       FROM quotations 
       WHERE quotation_no LIKE $1
       ORDER BY quotation_no DESC
       LIMIT 1`,
      [`MK${dateStr}-%`]
    );
    
    let serial = 1;
    if (result.rows.length > 0 && result.rows[0].quotation_no) {
      // 从最后一个编号中提取流水号并加1
      const lastSerial = parseInt(result.rows[0].quotation_no.split('-')[1]);
      serial = lastSerial + 1;
    }
    
    // 循环检查编号是否存在，直到找到未使用的编号
    let quotationNo = `MK${dateStr}-${String(serial).padStart(3, '0')}`;
    while (await this.exists(quotationNo)) {
      serial++;
      quotationNo = `MK${dateStr}-${String(serial).padStart(3, '0')}`;
    }
    
    return quotationNo;
  }

  /**
   * 检查报价单编号是否存在
   * @param {string} quotationNo - 报价单编号
   * @returns {Promise<boolean>} 是否存在
   */
  static async exists(quotationNo) {
    const quotation = await this.findByQuotationNo(quotationNo);
    return quotation !== null && quotation !== undefined;
  }

  /**
   * 获取用户的报价单统计
   * @param {number} userId - 用户 ID
   * @returns {Promise<Object>} 统计数据
   */
  static async getStatsByUser(userId) {
    const result = await dbManager.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM quotations
      WHERE created_by = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * 获取待审核的报价单列表
   * @returns {Promise<Array>} 报价单列表
   */
  static async getPendingReview() {
    const result = await dbManager.query(`
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
    return result.rows;
  }
}

module.exports = Quotation;
