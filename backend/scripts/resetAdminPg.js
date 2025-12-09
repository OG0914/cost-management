/**
 * 重置管理员账号脚本 (PostgreSQL 版本)
 * 运行: node scripts/resetAdminPg.js
 */

require('dotenv').config();
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

    console.log('========================================');
    console.log('管理员账号重置成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('角色: 管理员');
    console.log('ID:', result.rows[0].id);
    console.log('========================================');
    console.log('请在生产环境中立即修改密码！');
    
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('重置管理员账号失败:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdmin();
