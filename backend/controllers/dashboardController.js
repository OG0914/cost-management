/**
 * 仪表盘控制器
 * 提供仪表盘统计数据 API
 */

const dbManager = require('../db/database');
const { success, error } = require('../utils/response');

/**
 * 获取仪表盘统计数据
 * GET /api/dashboard/stats
 * 返回本月报价单数量、有效原料数量
 */
const getStats = async (req, res) => {
  try {
    // 获取本月开始日期
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    // 本月报价单数量
    const quotationsResult = await dbManager.query(
      `SELECT COUNT(*) as count FROM quotations WHERE created_at >= $1`,
      [monthStartStr]
    );
    const monthlyQuotations = parseInt(quotationsResult.rows[0]?.count || 0);

    // 上月报价单数量（用于计算增长率）
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthResult = await dbManager.query(
      `SELECT COUNT(*) as count FROM quotations WHERE created_at >= $1 AND created_at <= $2`,
      [lastMonthStart.toISOString().split('T')[0], lastMonthEnd.toISOString().split('T')[0]]
    );
    const lastMonthQuotations = parseInt(lastMonthResult.rows[0]?.count || 0);

    // 计算增长率
    let growthRate = null;
    if (lastMonthQuotations > 0) {
      growthRate = Math.round(((monthlyQuotations - lastMonthQuotations) / lastMonthQuotations) * 100);
    }

    // 有效原料 SKU 数量及最近更新时间
    const materialsResult = await dbManager.query(
      `SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM materials`
    );
    const activeMaterials = parseInt(materialsResult.rows[0]?.count || 0);
    const materialsLastUpdated = materialsResult.rows[0]?.last_updated || null;

    // 在售型号数量
    const modelsResult = await dbManager.query(
      `SELECT COUNT(*) as count FROM models WHERE is_active = true`
    );
    const activeModels = parseInt(modelsResult.rows[0]?.count || 0);

    res.json(success({
      monthlyQuotations,
      activeMaterials,
      activeModels,
      growthRate,
      materialsLastUpdated
    }, '获取统计数据成功'));

  } catch (err) {
    console.error('获取仪表盘统计数据失败:', err);
    res.status(500).json(error('获取统计数据失败: ' + err.message, 500));
  }
};

/**
 * 获取法规总览
 * GET /api/dashboard/regulations
 * 返回各法规类别及其型号数量
 */
const getRegulations = async (req, res) => {
  try {
    const result = await dbManager.query(`
      SELECT 
        r.name,
        COUNT(m.id) as count
      FROM regulations r
      LEFT JOIN models m ON r.id = m.regulation_id AND m.is_active = true
      WHERE r.is_active = true
      GROUP BY r.id, r.name
      ORDER BY count DESC
    `);

    const regulations = result.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count || 0)
    }));

    res.json(success(regulations, '获取法规总览成功'));

  } catch (err) {
    console.error('获取法规总览失败:', err);
    res.status(500).json(error('获取法规总览失败: ' + err.message, 500));
  }
};

/**
 * 获取型号排行
 * GET /api/dashboard/top-models
 * 返回本月报价次数最多的前3个型号
 */
const getTopModels = async (req, res) => {
  try {
    // 获取本月开始日期
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const result = await dbManager.query(`
      SELECT 
        m.model_name as "modelName",
        COUNT(q.id) as count
      FROM quotations q
      JOIN models m ON q.model_id = m.id
      WHERE q.created_at >= $1
      GROUP BY m.id, m.model_name
      ORDER BY count DESC
      LIMIT 3
    `, [monthStartStr]);

    const topModels = result.rows.map(row => ({
      modelName: row.modelName,
      count: parseInt(row.count || 0)
    }));

    res.json(success(topModels, '获取型号排行成功'));

  } catch (err) {
    console.error('获取型号排行失败:', err);
    res.status(500).json(error('获取型号排行失败: ' + err.message, 500));
  }
};

/**
 * 获取周报价统计
 * GET /api/dashboard/weekly-quotations
 * 返回本月和上月每周的报价单数量
 */
const getWeeklyQuotations = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 本月开始和结束
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    // 上月开始和结束
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);

    // 获取本月每周数据
    const thisMonthData = await getWeeklyData(thisMonthStart, thisMonthEnd);
    // 获取上月每周数据
    const lastMonthData = await getWeeklyData(lastMonthStart, lastMonthEnd);

    res.json(success({
      thisMonth: thisMonthData,
      lastMonth: lastMonthData
    }, '获取周报价统计成功'));

  } catch (err) {
    console.error('获取周报价统计失败:', err);
    res.status(500).json(error('获取周报价统计失败: ' + err.message, 500));
  }
};

/**
 * 辅助函数：获取指定月份每周的报价数量
 */
const getWeeklyData = async (monthStart, monthEnd) => {
  const weeks = [0, 0, 0, 0];

  const result = await dbManager.query(
    `SELECT created_at FROM quotations WHERE created_at >= $1 AND created_at <= $2`,
    [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
  );

  result.rows.forEach(row => {
    const date = new Date(row.created_at);
    const dayOfMonth = date.getDate();
    // 简单按日期分周：1-7为第1周，8-14为第2周，15-21为第3周，22+为第4周
    const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
    weeks[weekIndex]++;
  });

  return weeks;
};

/**
 * 获取最近操作记录
 * GET /api/dashboard/recent-activities
 * 返回当前用户最近的操作记录
 */
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const activities = [];

    // 根据角色获取不同的操作记录

    // 1. 审核员：获取待审核及已审核记录
    if (userRole === 'reviewer') {
      const quotationsResult = await dbManager.query(`
        SELECT q.quotation_no, q.status, q.updated_at, q.customer_name, u.real_name as creator_name
        FROM quotations q
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.status = 'submitted' OR q.reviewed_by = $1
        ORDER BY q.updated_at DESC
        LIMIT 10
      `, [userId]);

      quotationsResult.rows.forEach(row => {
        let content = '';
        let icon = 'ri-file-list-3-line';

        if (row.status === 'submitted') {
          // "张三 提交了 Q20230101 报价单（XX公司）"
          content = `${row.creator_name || '未知用户'} 提交了 ${row.quotation_no} 报价单（${row.customer_name}）`;
          icon = 'ri-time-line';
        } else {
          // "已通过 Q20230101 报价单（XX公司）"
          const statusMap = { approved: '通过', rejected: '退回' };
          const action = statusMap[row.status] || '审核';
          content = `已${action} ${row.quotation_no} 报价单（${row.customer_name}）`;
          icon = 'ri-checkbox-circle-line';
        }

        activities.push({
          icon,
          content,
          time: formatTimeAgo(row.updated_at),
          rawTime: row.updated_at
        });
      });
    }

    // 2. 业务员/管理员：获取自己创建的报价单操作
    else if (['salesperson', 'admin'].includes(userRole)) {
      const quotationsResult = await dbManager.query(`
        SELECT q.quotation_no, q.status, q.updated_at, q.customer_name
        FROM quotations q
        WHERE q.created_by = $1
        ORDER BY q.updated_at DESC
        LIMIT 10
      `, [userId]);

      quotationsResult.rows.forEach(row => {
        const statusMap = { draft: '创建草稿', submitted: '提交审核', approved: '审核通过', rejected: '被退回' };
        activities.push({
          icon: 'ri-file-list-3-line',
          content: `报价单 ${row.quotation_no}（${row.customer_name}）${statusMap[row.status] || row.status}`,
          time: formatTimeAgo(row.updated_at),
          rawTime: row.updated_at
        });
      });
    }

    // 3. 采购/生产/管理员：获取最近的原料更新
    if (['purchaser', 'producer', 'admin'].includes(userRole)) {
      const materialsResult = await dbManager.query(`
        SELECT name, updated_at FROM materials
        ORDER BY updated_at DESC
        LIMIT 10
      `);

      materialsResult.rows.forEach(row => {
        activities.push({
          icon: 'ri-stack-line',
          content: `原料「${row.name}」已更新`,
          time: formatTimeAgo(row.updated_at),
          rawTime: row.updated_at
        });
      });
    }

    // 按时间排序，取最近5条
    activities.sort((a, b) => new Date(b.rawTime || 0) - new Date(a.rawTime || 0));

    res.json(success(activities.slice(0, 5), '获取最近操作成功'));
  } catch (err) {
    console.error('获取最近操作失败:', err);
    res.status(500).json(error('获取最近操作失败: ' + err.message, 500));
  }
};

// 格式化时间为"多久前"
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
};

module.exports = {
  getStats,
  getRegulations,
  getTopModels,
  getWeeklyQuotations,
  getRecentActivities
};
