/**
 * 审核控制器
 * 处理报价单审核相关操作
 */

const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const Comment = require('../models/Comment');
const { success, error, paginated } = require('../utils/response');
const dbManager = require('../db/database');
const { formatPackagingMethod } = require('../config/packagingTypes');

/**
 * 获取待审核列表
 * GET /api/review/pending
 * 仅返回状态为 submitted 的报价单
 * 业务员只能看到自己提交的报价单
 */
const getPendingList = async (req, res) => {
  try {
    const { customer_name, model_name, start_date, end_date, page = 1, page_size = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let sql = `
      SELECT 
        q.id, q.quotation_no, q.customer_name, q.customer_region,
        q.quantity, q.sales_type, q.final_price, q.currency, q.status,
        q.created_at, q.submitted_at,
        m.model_name, r.name as regulation_name,
        u.real_name as creator_name,
        pc.config_name, pc.packaging_type, pc.layer1_qty, pc.layer2_qty, pc.layer3_qty
      FROM quotations q
      LEFT JOIN models m ON q.model_id = m.id
      LEFT JOIN regulations r ON q.regulation_id = r.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN packaging_configs pc ON q.packaging_config_id = pc.id
      WHERE q.status = 'submitted'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // 业务员只能看到自己提交的报价单
    if (userRole === 'salesperson') {
      sql += ` AND q.created_by = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (customer_name) {
      sql += ` AND q.customer_name ILIKE $${paramIndex}`;
      params.push(`%${customer_name}%`);
      paramIndex++;
    }
    
    if (model_name) {
      sql += ` AND m.model_name ILIKE $${paramIndex}`;
      params.push(`%${model_name}%`);
      paramIndex++;
    }
    
    if (start_date) {
      sql += ` AND q.submitted_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      sql += ` AND q.submitted_at <= $${paramIndex}`;
      params.push(end_date + ' 23:59:59');
      paramIndex++;
    }
    
    // 获取总数
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await dbManager.query(countSql, params);
    const total = parseInt(countResult.rows[0].total);
    
    // 分页
    sql += ` ORDER BY q.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    
    const result = await dbManager.query(sql, params);
    
    // 格式化包装方式显示
    const rows = result.rows.map(row => {
      let packaging_config_name = null;
      if (row.config_name && row.packaging_type) {
        const formatted = formatPackagingMethod(row.packaging_type, row.layer1_qty, row.layer2_qty, row.layer3_qty);
        packaging_config_name = row.config_name + formatted;
      }
      return { ...row, packaging_config_name };
    });
    
    res.json(paginated(rows, total, parseInt(page), parseInt(page_size)));
  } catch (err) {
    console.error('获取待审核列表失败:', err);
    res.status(500).json(error('获取待审核列表失败', 500));
  }
};

/**
 * 获取已审核列表
 * GET /api/review/approved
 * 返回状态为 approved 或 rejected 的报价单
 * 业务员只能看到自己提交的报价单
 */
const getApprovedList = async (req, res) => {
  try {
    const { status, customer_name, model_name, start_date, end_date, page = 1, page_size = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let sql = `
      SELECT 
        q.id, q.quotation_no, q.customer_name, q.customer_region,
        q.quantity, q.sales_type, q.final_price, q.currency, q.status,
        q.created_at, q.submitted_at, q.reviewed_at,
        m.model_name, r.name as regulation_name,
        u.real_name as creator_name,
        rv.real_name as reviewer_name,
        pc.config_name, pc.packaging_type, pc.layer1_qty, pc.layer2_qty, pc.layer3_qty
      FROM quotations q
      LEFT JOIN models m ON q.model_id = m.id
      LEFT JOIN regulations r ON q.regulation_id = r.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users rv ON q.reviewed_by = rv.id
      LEFT JOIN packaging_configs pc ON q.packaging_config_id = pc.id
      WHERE q.status IN ('approved', 'rejected')
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // 业务员只能看到自己提交的报价单
    if (userRole === 'salesperson') {
      sql += ` AND q.created_by = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status && ['approved', 'rejected'].includes(status)) {
      sql += ` AND q.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (customer_name) {
      sql += ` AND q.customer_name ILIKE $${paramIndex}`;
      params.push(`%${customer_name}%`);
      paramIndex++;
    }
    
    if (model_name) {
      sql += ` AND m.model_name ILIKE $${paramIndex}`;
      params.push(`%${model_name}%`);
      paramIndex++;
    }
    
    if (start_date) {
      sql += ` AND q.reviewed_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      sql += ` AND q.reviewed_at <= $${paramIndex}`;
      params.push(end_date + ' 23:59:59');
      paramIndex++;
    }
    
    // 获取总数
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await dbManager.query(countSql, params);
    const total = parseInt(countResult.rows[0].total);
    
    // 分页
    sql += ` ORDER BY q.reviewed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    
    const result = await dbManager.query(sql, params);
    
    // 格式化包装方式显示
    const rows = result.rows.map(row => {
      let packaging_config_name = null;
      if (row.config_name && row.packaging_type) {
        const formatted = formatPackagingMethod(row.packaging_type, row.layer1_qty, row.layer2_qty, row.layer3_qty);
        packaging_config_name = row.config_name + formatted;
      }
      return { ...row, packaging_config_name };
    });
    
    res.json(paginated(rows, total, parseInt(page), parseInt(page_size)));
  } catch (err) {
    console.error('获取已审核列表失败:', err);
    res.status(500).json(error('获取已审核列表失败', 500));
  }
};


/**
 * 获取报价单审核详情
 * GET /api/review/:id/detail
 * 业务员只能查看自己提交的报价单
 */
const getReviewDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // 获取报价单基本信息
    const quotationSql = `
      SELECT 
        q.*,
        m.model_name, r.name as regulation_name,
        u.real_name as creator_name,
        rv.real_name as reviewer_name,
        pc.config_name as packaging_config_name,
        pc.packaging_type, pc.layer1_qty, pc.layer2_qty, pc.layer3_qty,
        pc.pc_per_bag, pc.bags_per_box, pc.boxes_per_carton
      FROM quotations q
      LEFT JOIN models m ON q.model_id = m.id
      LEFT JOIN regulations r ON q.regulation_id = r.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users rv ON q.reviewed_by = rv.id
      LEFT JOIN packaging_configs pc ON q.packaging_config_id = pc.id
      WHERE q.id = $1
    `;
    
    const quotationResult = await dbManager.query(quotationSql, [id]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json(error('报价单不存在', 404));
    }
    
    const quotation = quotationResult.rows[0];
    
    // 业务员只能查看自己提交的报价单
    if (userRole === 'salesperson' && quotation.created_by !== userId) {
      return res.status(403).json(error('无权限查看此报价单', 403));
    }
    
    // 获取报价单明细
    const items = await QuotationItem.findByQuotationId(id);
    
    // 获取标准配置明细（用于差异对比）
    // 从标准成本关联的报价单获取标准明细
    let standardItems = [];
    if (quotation.packaging_config_id) {
      // 查找该包装配置对应的标准成本
      const standardCostSql = `
        SELECT quotation_id FROM standard_costs 
        WHERE packaging_config_id = $1 AND sales_type = $2 AND is_current = true
        LIMIT 1
      `;
      const standardCostResult = await dbManager.query(standardCostSql, [
        quotation.packaging_config_id, 
        quotation.sales_type
      ]);
      
      if (standardCostResult.rows.length > 0) {
        // 从标准成本关联的报价单获取所有明细（原料、工序、包材）
        const standardQuotationId = standardCostResult.rows[0].quotation_id;
        const standardItemsSql = `
          SELECT category, item_name, usage_amount, unit_price, subtotal, material_id
          FROM quotation_items
          WHERE quotation_id = $1
          ORDER BY category, id
        `;
        const standardItemsResult = await dbManager.query(standardItemsSql, [standardQuotationId]);
        standardItems = standardItemsResult.rows;
      }
    }
    
    // 获取批注/退回原因
    const comments = await Comment.findByQuotationId(id);
    
    // 获取审核历史
    const historySql = `
      SELECT rh.*, u.real_name as operator_name
      FROM review_history rh
      LEFT JOIN users u ON rh.operator_id = u.id
      WHERE rh.quotation_id = $1
      ORDER BY rh.created_at ASC
    `;
    let history = [];
    try {
      const historyResult = await dbManager.query(historySql, [id]);
      history = historyResult.rows;
    } catch (e) {
      // review_history 表可能还不存在
      console.log('审核历史表不存在，跳过');
    }
    
    res.json(success({
      quotation,
      items,
      standardItems,
      comments,
      history
    }));
  } catch (err) {
    console.error('获取审核详情失败:', err);
    res.status(500).json(error('获取审核详情失败', 500));
  }
};

/**
 * 审核通过
 * POST /api/review/:id/approve
 */
const approveQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const reviewerId = req.user.id;
    
    // 检查报价单状态
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json(error('报价单不存在', 404));
    }
    
    if (quotation.status !== 'submitted') {
      return res.status(400).json(error('当前状态不允许审核操作', 400));
    }
    
    // 更新报价单状态
    await dbManager.query(
      `UPDATE quotations SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [reviewerId, id]
    );
    
    // 保存审核批注
    if (comment) {
      await Comment.create({
        quotation_id: id,
        user_id: reviewerId,
        content: comment
      });
    }
    
    // 记录审核历史
    try {
      await dbManager.query(
        `INSERT INTO review_history (quotation_id, action, operator_id, comment) VALUES ($1, 'approved', $2, $3)`,
        [id, reviewerId, comment || null]
      );
    } catch (e) {
      console.log('记录审核历史失败（表可能不存在）:', e.message);
    }
    
    res.json(success({ message: '审核通过成功' }));
  } catch (err) {
    console.error('审核通过失败:', err);
    res.status(500).json(error('审核通过失败', 500));
  }
};

/**
 * 审核退回
 * POST /api/review/:id/reject
 */
const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user.id;
    
    // 验证退回原因必填
    if (!reason || !reason.trim()) {
      return res.status(400).json(error('请输入退回原因', 400));
    }
    
    // 检查报价单状态
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json(error('报价单不存在', 404));
    }
    
    if (quotation.status !== 'submitted') {
      return res.status(400).json(error('当前状态不允许退回操作', 400));
    }
    
    // 更新报价单状态
    await dbManager.query(
      `UPDATE quotations SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [reviewerId, id]
    );
    
    // 保存退回原因到批注
    await Comment.create({
      quotation_id: id,
      user_id: reviewerId,
      content: `【退回原因】${reason}`
    });
    
    // 记录审核历史
    try {
      await dbManager.query(
        `INSERT INTO review_history (quotation_id, action, operator_id, comment) VALUES ($1, 'rejected', $2, $3)`,
        [id, reviewerId, reason]
      );
    } catch (e) {
      console.log('记录审核历史失败（表可能不存在）:', e.message);
    }
    
    res.json(success({ message: '退回成功' }));
  } catch (err) {
    console.error('审核退回失败:', err);
    res.status(500).json(error('审核退回失败', 500));
  }
};

/**
 * 重新提交
 * POST /api/review/:id/resubmit
 */
const resubmitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 检查报价单状态
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json(error('报价单不存在', 404));
    }
    
    if (quotation.status !== 'rejected') {
      return res.status(400).json(error('只有已退回的报价单才能重新提交', 400));
    }
    
    // 检查是否是创建人
    if (quotation.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json(error('只有创建人才能重新提交', 403));
    }
    
    // 更新报价单状态
    await dbManager.query(
      `UPDATE quotations SET status = 'submitted', submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
    
    // 记录审核历史
    try {
      await dbManager.query(
        `INSERT INTO review_history (quotation_id, action, operator_id) VALUES ($1, 'resubmitted', $2)`,
        [id, userId]
      );
    } catch (e) {
      console.log('记录审核历史失败（表可能不存在）:', e.message);
    }
    
    res.json(success({ message: '重新提交成功' }));
  } catch (err) {
    console.error('重新提交失败:', err);
    res.status(500).json(error('重新提交失败', 500));
  }
};

/**
 * 删除报价单（仅管理员）
 * DELETE /api/review/:id
 */
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json(error('只有管理员才能删除报价单', 403));
    }
    
    // 检查报价单是否存在
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json(error('报价单不存在', 404));
    }
    
    // 删除报价单（级联删除明细和批注）
    await dbManager.query('DELETE FROM quotations WHERE id = $1', [id]);
    
    res.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除报价单失败:', err);
    res.status(500).json(error('删除报价单失败', 500));
  }
};

module.exports = {
  getPendingList,
  getApprovedList,
  getReviewDetail,
  approveQuotation,
  rejectQuotation,
  resubmitQuotation,
  deleteQuotation
};
