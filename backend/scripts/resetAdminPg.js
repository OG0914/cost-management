/**
 * 重置管理员账号脚本 (PostgreSQL 版本)
 * 运行: node scripts/resetAdminPg.js
 */

require('dotenv').config();
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function resetAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 删除旧的管理员账号
    await pool.query('DELETE FROM users WHERE username = $1', ['admin']);

    // 创建新的管理员账号
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, password, role, real_name, email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['admin', hashedPassword, 'admin', '系统管理员', 'admin@example.com', true]);

    logger.info('========================================');
    logger.info('管理员账号重置成功！');
    logger.info('用户名: admin');
    logger.info('密码: admin123');
    logger.info('角色: 管理员');
    logger.info('ID:', result.rows[0].id);
    logger.info('========================================');
    logger.info('请在生产环境中立即修改密码！');

    await pool.end();
    process.exit(0);

  } catch (error) {
    logger.error('重置管理员账号失败:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdmin();
