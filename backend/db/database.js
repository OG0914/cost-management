/**
 * PostgreSQL 数据库管理器
 * 使用连接池管理数据库连接
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  /**
   * 初始化数据库连接池
   * @returns {Promise<Pool>} 连接池实例
   */
  async initialize() {
    if (this.isInitialized) {
      return this.pool;
    }

    try {
      // 从环境变量获取配置
      const connectionString = process.env.DATABASE_URL;

      const poolConfig = {
        min: parseInt(process.env.PG_POOL_MIN) || 2,
        max: parseInt(process.env.PG_POOL_MAX) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

      // 优先使用 DATABASE_URL，否则使用独立配置
      if (connectionString) {
        poolConfig.connectionString = connectionString;
      } else {
        poolConfig.host = process.env.PGHOST || 'localhost';
        poolConfig.port = parseInt(process.env.PGPORT) || 5432;
        poolConfig.database = process.env.PGDATABASE || 'cost_analysis';
        poolConfig.user = process.env.PGUSER || 'postgres';
        poolConfig.password = process.env.PGPASSWORD || 'postgres';
      }

      // 创建连接池
      this.pool = new Pool(poolConfig);

      // 监听连接池错误
      this.pool.on('error', (err) => {
        logger.error('数据库连接池错误:', err);
      });

      // 为每个新连接设置北京时区
      this.pool.on('connect', (client) => {
        client.query("SET TIME ZONE 'Asia/Shanghai'");
      });

      // 测试连接
      const client = await this.pool.connect();

      // 设置当前连接的时区为北京时间
      await client.query("SET TIME ZONE 'Asia/Shanghai'");
      logger.info('PostgreSQL 连接成功，时区设置为北京时间 (Asia/Shanghai)');
      client.release();

      this.isInitialized = true;

      // 初始化表结构
      await this.initializeTables();

      // 执行迁移
      await this.runMigrations();

      return this.pool;
    } catch (error) {
      logger.error('数据库初始化失败:', error);
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 初始化数据表
   */
  async initializeTables() {
    // 检查核心表是否已存在，避免重复执行 schema.sql
    const result = await this.pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"
    );
    
    if (result.rows[0].exists) {
      logger.debug('数据表已存在，跳过初始化');
      return;
    }

    const sqlPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await this.pool.query(sql);
      logger.info('数据表初始化完成');
    } else {
      logger.warn('未找到 schema.sql 文件');
    }
  }

  /**
   * 执行数据库迁移
   */
  async runMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      return;
    }

    // 创建迁移记录表
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 获取已执行的迁移
    const result = await this.pool.query('SELECT name FROM migrations');
    const executedMigrations = result.rows.map(r => r.name);

    // 执行未执行的迁移
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await this.pool.query(sql);
        await this.pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        logger.info(`迁移执行成功: ${file}`);
      } catch (error) {
        logger.error(`迁移执行失败: ${file}`, error.message);
      }
    }
  }

  /**
   * 获取连接池实例
   * @returns {Pool} 连接池
   */
  getPool() {
    if (!this.pool) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }
    return this.pool;
  }

  /**
   * 执行查询（自动转换占位符）
   * @param {string} sql - SQL 语句（可使用 ? 或 $n 占位符）
   * @param {Array} params - 参数数组
   * @returns {Promise<Object>} 查询结果
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('数据库未初始化');
    }

    // 转换占位符：? -> $1, $2, ...
    const convertedSql = this.convertPlaceholders(sql);

    return this.pool.query(convertedSql, params);
  }

  /**
   * 转换 SQL 占位符从 ? 到 $n 格式
   * @param {string} sql - 原始 SQL
   * @returns {string} 转换后的 SQL
   */
  convertPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  /**
   * 执行事务
   * @param {Function} fn - 事务函数，接收 client 参数
   * @returns {Promise<any>} 事务执行结果
   */
  async transaction(fn) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 关闭数据库连接池
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('数据库连接池已关闭');
    }
  }

  // ============ 兼容旧 API 的方法 ============

  /**
   * 兼容旧代码：获取数据库实例
   * @deprecated 请使用 getPool() 或 query()
   * @returns {Object} 包含兼容方法的对象
   */
  getDatabase() {
    const self = this;
    return {
      /**
       * 兼容 better-sqlite3 的 prepare 方法
       * 返回一个模拟的 statement 对象
       */
      prepare(sql) {
        return {
          /**
           * 获取单条记录
           */
          async get(...params) {
            const result = await self.query(sql, params);
            return result.rows[0] || null;
          },

          /**
           * 获取所有记录
           */
          async all(...params) {
            const result = await self.query(sql, params);
            return result.rows;
          },

          /**
           * 执行写操作
           */
          async run(...params) {
            const result = await self.query(sql, params);
            return {
              changes: result.rowCount,
              lastInsertRowid: result.rows[0]?.id || null
            };
          }
        };
      },

      /**
       * 兼容 better-sqlite3 的 exec 方法
       */
      async exec(sql) {
        return self.pool.query(sql);
      },

      /**
       * 兼容 better-sqlite3 的 transaction 方法
       */
      transaction(fn) {
        return async (...args) => {
          return self.transaction(async (client) => {
            // 创建一个兼容的 client 包装
            const wrappedClient = {
              prepare(sql) {
                return {
                  async get(...params) {
                    const convertedSql = self.convertPlaceholders(sql);
                    const result = await client.query(convertedSql, params);
                    return result.rows[0] || null;
                  },
                  async all(...params) {
                    const convertedSql = self.convertPlaceholders(sql);
                    const result = await client.query(convertedSql, params);
                    return result.rows;
                  },
                  async run(...params) {
                    const convertedSql = self.convertPlaceholders(sql);
                    const result = await client.query(convertedSql, params);
                    return {
                      changes: result.rowCount,
                      lastInsertRowid: result.rows[0]?.id || null
                    };
                  }
                };
              }
            };
            return fn.call(wrappedClient, ...args);
          });
        };
      }
    };
  }
}

// 导出单例
const dbManager = new DatabaseManager();
module.exports = dbManager;
