/**
 * 检查数据库中的用户
 */

require('dotenv').config();
const path = require('path');
const dbManager = require('../db/database');

function checkUsers() {
  try {
    const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');
    dbManager.initialize(dbPath);
    
    const db = dbManager.getDatabase();
    const users = db.prepare('SELECT id, username, role, real_name, email, is_active FROM users').all();
    
    console.log('========================================');
    console.log('数据库中的用户列表:');
    console.log('========================================');
    
    if (users.length === 0) {
      console.log('❌ 数据库中没有用户！');
      console.log('请运行: node scripts/createAdmin.js');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`用户名: ${user.username}`);
        console.log(`角色: ${user.role}`);
        console.log(`真实姓名: ${user.real_name || '未设置'}`);
        console.log(`邮箱: ${user.email || '未设置'}`);
        console.log(`状态: ${user.is_active ? '✅ 启用' : '❌ 禁用'}`);
        console.log('---');
      });
    }
    
    console.log('========================================');
    
    dbManager.close();
    process.exit(0);
  } catch (error) {
    console.error('检查用户失败:', error);
    process.exit(1);
  }
}

checkUsers();
