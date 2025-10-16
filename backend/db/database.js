const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  // 初始化数据库连接
  initialize(dbPath) {
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 创建数据库连接
      this.db = new Database(dbPath, { verbose: console.log });
      this.db.pragma('journal_mode = WAL'); // 启用 WAL 模式提高性能
      
      console.log('数据库连接成功:', dbPath);
      
      // 初始化表结构
      this.initializeTables();
      
      return this.db;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  // 初始化数据表
  initializeTables() {
    const sqlPath = path.join(__dirname, 'seedData.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      this.db.exec(sql);
      console.log('数据表初始化完成');
    } else {
      console.warn('未找到 seedData.sql 文件');
    }
  }

  // 获取数据库实例
  getDatabase() {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db;
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 导出单例
const dbManager = new DatabaseManager();
module.exports = dbManager;
