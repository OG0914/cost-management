/**
 * 创建默认管理员账号脚本
 * 运行: node scripts/createAdmin.js
 */

require('dotenv').config();
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const path = require('path');
const dbManager = require('../db/database');
const User = require('../models/User');

async function createAdmin() {
  try {
    // 初始化数据库
    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);

    // 检查管理员是否已存在
    if (User.exists('admin')) {
      logger.info('管理员账号已存在');
      process.exit(0);
    }

    // 创建管理员账号
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminId = User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      real_name: '系统管理员',
      email: 'admin@example.com'
    });

    logger.info('========================================');
    logger.info('管理员账号创建成功！');
    logger.info('用户名: admin');
    logger.info('密码: admin123');
    logger.info('角色: 管理员');
    logger.info('ID:', adminId);
    logger.info('========================================');
    logger.info('请在生产环境中立即修改密码！');

    dbManager.close();
    process.exit(0);

  } catch (error) {
    logger.error('创建管理员账号失败:', error);
    process.exit(1);
  }
}

createAdmin();
