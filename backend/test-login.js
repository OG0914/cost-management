/**
 * 测试登录功能
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const dbManager = require('./db/database');

async function testLogin() {
  try {
    console.log('========================================');
    console.log('测试登录功能');
    console.log('========================================');
    
    // 检查环境变量
    console.log('\n1. 检查环境变量:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
    console.log('PORT:', process.env.PORT);
    
    // 初始化数据库
    const dbPath = path.resolve(__dirname, './db/cost_analysis.db');
    dbManager.initialize(dbPath);
    const db = dbManager.getDatabase();
    
    // 查询管理员账号
    console.log('\n2. 查询管理员账号:');
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get('admin');
    
    if (!user) {
      console.log('❌ 管理员账号不存在');
      return;
    }
    
    console.log('✅ 找到管理员账号');
    console.log('ID:', user.id);
    console.log('用户名:', user.username);
    console.log('角色:', user.role);
    console.log('密码哈希:', user.password.substring(0, 20) + '...');
    
    // 测试密码验证
    console.log('\n3. 测试密码验证:');
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('密码 "admin123" 验证结果:', isValid ? '✅ 正确' : '❌ 错误');
    
    if (!isValid) {
      console.log('\n密码不匹配，需要重置管理员账号');
      return;
    }
    
    // 测试 JWT 生成
    console.log('\n4. 测试 JWT Token 生成:');
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token 生成成功');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 测试 JWT 验证
    console.log('\n5. 测试 JWT Token 验证:');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token 验证成功');
    console.log('解码后的用户信息:', decoded);
    
    console.log('\n========================================');
    console.log('✅ 所有测试通过！登录功能正常');
    console.log('========================================');
    
    dbManager.close();
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

testLogin();
