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

module.exports = {
  getStats,
  getRegulations,
  getTopModels,
  getWeeklyQuotations
};
