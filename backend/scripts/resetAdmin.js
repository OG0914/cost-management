/**
 * 重置管理员账号脚本
 * 运行: node scripts/resetAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const dbManager = require('../db/database');

async function resetAdmin() {
  try {
    // 初始化数据库
    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);

    const db = dbManager.getDatabase();

    // 删除旧的管理员账号
    const deleteStmt = db.prepare('DELETE FROM users WHERE username = ?');
    deleteStmt.run('admin');

    // 创建新的管理员账号
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password, role, real_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      'admin',
      hashedPassword,
      'admin',
      '系统管理员',
      'admin@example.com'
    );

    console.log('========================================');
    console.log('管理员账号重置成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('角色: 管理员');
    console.log('ID:', result.lastInsertRowid);
    console.log('========================================');
    console.log('请在生产环境中立即修改密码！');
    
    dbManager.close();
    process.exit(0);

  } catch (error) {
    console.error('重置管理员账号失败:', error);
    process.exit(1);
  }
}

resetAdmin();
