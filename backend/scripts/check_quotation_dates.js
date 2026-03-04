/**
 * 临时脚本：检查报价单创建日期分布
 * 用于排查仪表盘图表数据异常
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const { Client } = require('pg');

async function checkQuotationDates() {
  const client = new Client(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    logger.info('数据库连接成功\n');

    // 1. 查询所有1月份的报价单（2026年）
    const janResult = await client.query(`
      SELECT
        id,
        quotation_no,
        created_at,
        EXTRACT(DAY FROM created_at) as day_of_month
      FROM quotations
      WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01'
      ORDER BY created_at DESC
    `);

    logger.info('=== 2026年1月报价单列表 ===');
    logger.info(`总计: ${janResult.rows.length} 条\n`);

    if (janResult.rows.length > 0) {
      janResult.rows.forEach(row => {
        logger.info(`ID: ${row.id}, 报价单号: ${row.quotation_no}, 创建时间: ${row.created_at}, 日期: ${row.day_of_month}日`);
      });
    }

    // 2. 检查是否有22日及之后的数据
    const after22Result = await client.query(`
      SELECT
        id,
        quotation_no,
        created_at
      FROM quotations
      WHERE created_at >= '2026-01-22'
      ORDER BY created_at
    `);

    logger.info('\n=== 1月22日及之后的报价单 ===');
    logger.info(`总计: ${after22Result.rows.length} 条\n`);

    if (after22Result.rows.length > 0) {
      after22Result.rows.forEach(row => {
        logger.info(`ID: ${row.id}, 报价单号: ${row.quotation_no}, 创建时间: ${row.created_at}`);
      });
    } else {
      logger.info('没有找到1月22日及之后创建的报价单');
    }

    // 3. 按周统计本月报价单数量
    const weeklyResult = await client.query(`
      SELECT
        CASE
          WHEN EXTRACT(DAY FROM created_at) BETWEEN 1 AND 7 THEN '第1周 (1-7日)'
          WHEN EXTRACT(DAY FROM created_at) BETWEEN 8 AND 14 THEN '第2周 (8-14日)'
          WHEN EXTRACT(DAY FROM created_at) BETWEEN 15 AND 21 THEN '第3周 (15-21日)'
          ELSE '第4周 (22日及以后)'
        END as week_range,
        COUNT(*) as count
      FROM quotations
      WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01'
      GROUP BY week_range
      ORDER BY week_range
    `);

    logger.info('\n=== 本月按周统计 ===');
    if (weeklyResult.rows.length > 0) {
      weeklyResult.rows.forEach(row => {
        logger.info(`${row.week_range}: ${row.count} 条`);
      });
    } else {
      logger.info('本月暂无报价单数据');
    }

    // 4. 检查是否有未来日期的数据
    const futureResult = await client.query(`
      SELECT
        id,
        quotation_no,
        created_at
      FROM quotations
      WHERE created_at > NOW()
      ORDER BY created_at
    `);

    logger.info('\n=== 未来日期的报价单（异常数据） ===');
    logger.info(`总计: ${futureResult.rows.length} 条\n`);

    if (futureResult.rows.length > 0) {
      logger.info('⚠️ 发现异常数据！存在创建时间在未来的报价单：');
      futureResult.rows.forEach(row => {
        logger.info(`ID: ${row.id}, 报价单号: ${row.quotation_no}, 创建时间: ${row.created_at}`);
      });
    } else {
      logger.info('✓ 没有发现未来日期的异常数据');
    }

  } catch (err) {
    logger.error('查询失败:', err.message);
  } finally {
    await client.end();
    logger.info('\n数据库连接已关闭');
  }
}

checkQuotationDates();
