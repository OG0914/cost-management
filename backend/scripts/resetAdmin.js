/**
 * 重置管理员账号脚本
 * 运行: node scripts/resetAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const dbManager = require('../db/database');

async function resetAdmin() {
  try {
    // 初始化数据库连接
    await dbManager.initialize();

    // 删除旧的管理员账号
    await dbManager.query('DELETE FROM users WHERE username = $1', ['admin']);

    // 创建新的管理员账号
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await dbManager.query(`
      INSERT INTO users (username, password, role, real_name, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['admin', hashedPassword, 'admin', '系统管理员', 'admin@example.com']);

    logger.info('========================================');
    logger.info('管理员账号重置成功！');
    logger.info('用户名: admin');
    logger.info('密码: admin123');
    logger.info('角色: 管理员');
    logger.info('ID:', result.rows[0].id);
    logger.info('========================================');
    logger.info('请在生产环境中立即修改密码！');

    await dbManager.close();
    process.exit(0);

  } catch (error) {
    logger.error('重置管理员账号失败:', error);
    process.exit(1);
  }
}

resetAdmin();
