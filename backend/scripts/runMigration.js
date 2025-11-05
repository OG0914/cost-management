/**
 * 运行数据库迁移脚本
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径
const dbPath = path.join(__dirname, '../db/cost_analysis.db');
const migrationsDir = path.join(__dirname, '../db/migrations');

console.log('开始运行数据库迁移...');
console.log('数据库路径:', dbPath);
console.log('迁移文件目录:', migrationsDir);

try {
  // 连接数据库
  const db = new Database(dbPath);
  
  // 创建迁移记录表（如果不存在）
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 获取已执行的迁移
  const executedMigrations = db.prepare('SELECT filename FROM migrations').all();
  const executedFiles = new Set(executedMigrations.map(m => m.filename));
  
  // 读取迁移文件
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // 按文件名排序
  
  console.log(`\n找到 ${migrationFiles.length} 个迁移文件`);
  
  let executedCount = 0;
  
  // 执行未运行的迁移
  for (const file of migrationFiles) {
    if (executedFiles.has(file)) {
      console.log(`✓ 跳过已执行的迁移: ${file}`);
      continue;
    }
    
    console.log(`\n执行迁移: ${file}`);
    
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      // 在事务中执行迁移
      db.transaction(() => {
        db.exec(sql);
        db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
      })();
      
      console.log(`✓ 成功执行: ${file}`);
      executedCount++;
    } catch (error) {
      console.error(`✗ 执行失败: ${file}`);
      console.error('错误信息:', error.message);
      throw error;
    }
  }
  
  db.close();
  
  console.log(`\n迁移完成！共执行 ${executedCount} 个新迁移`);
  
} catch (error) {
  console.error('\n迁移失败:', error);
  process.exit(1);
}
