# Design Document: PostgreSQL Migration

## Overview

本设计文档描述将成本计算系统从 SQLite 迁移到 PostgreSQL 的技术方案。迁移涉及数据库连接层重构、12 个 Model 文件的异步化改造、SQL 语法适配、表结构转换和数据迁移。

### 迁移范围

```
backend/
├── db/
│   ├── database.js              # 重写：SQLite → PostgreSQL 连接池
│   ├── seedData.sql             # 转换：DDL 语法适配
│   └── migrations/              # 新增：PostgreSQL 迁移脚本
├── models/                      # 改造：同步 → 异步（12个文件）
│   ├── Material.js
│   ├── Model.js
│   ├── PackagingConfig.js
│   ├── PackagingMaterial.js
│   ├── ProcessConfig.js
│   ├── Quotation.js
│   ├── QuotationCustomFee.js
│   ├── QuotationItem.js
│   ├── Regulation.js
│   ├── StandardCost.js
│   ├── SystemConfig.js
│   └── User.js
├── controllers/                 # 适配：添加 await
├── utils/
│   └── queryBuilder.js          # 改造：占位符格式
└── package.json                 # 更新：依赖变更
```

## Architecture

### 当前架构（SQLite）

```
┌─────────────────────────────────────────────────────────┐
│                     Controller                          │
│                   (同步调用)                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Model                              │
│              db.prepare().get/all/run()                 │
│                   (同步执行)                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  DatabaseManager                        │
│                 (better-sqlite3)                        │
│                   单文件存储                             │
└─────────────────────────────────────────────────────────┘
```

### 目标架构（PostgreSQL）

```
┌─────────────────────────────────────────────────────────┐
│                     Controller                          │
│                 (async/await 调用)                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Model                              │
│              await pool.query()                         │
│                   (异步执行)                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  DatabaseManager                        │
│                    (pg Pool)                            │
│              连接池 (min: 2, max: 20)                    │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL                            │
│              独立数据库服务进程                           │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DatabaseManager（核心改造）

#### 当前接口
```javascript
// 同步 API
class DatabaseManager {
  initialize(dbPath)      // 初始化文件数据库
  getDatabase()           // 返回 better-sqlite3 实例
  close()                 // 关闭连接
}
```

#### 目标接口
```javascript
// 异步 API
class DatabaseManager {
  async initialize()      // 初始化连接池
  getPool()               // 返回 pg Pool 实例
  async query(sql, params)// 执行查询（封装占位符转换）
  async transaction(fn)   // 执行事务
  async close()           // 关闭连接池
}
```

#### 配置参数
```javascript
const poolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'cost_analysis',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  min: parseInt(process.env.PG_POOL_MIN) || 2,
  max: parseInt(process.env.PG_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### 2. Model 层接口变化

#### 当前模式（同步）
```javascript
class User {
  static findById(id) {
    const db = dbManager.getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);  // 同步返回
  }
}
```

#### 目标模式（异步）
```javascript
class User {
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;  // 异步返回
  }
}
```

### 3. QueryBuilder 接口变化

#### 占位符转换
```javascript
// 当前：SQLite 占位符
{ sql: 'SELECT * FROM users WHERE status = ? AND role = ?', params: ['active', 'admin'] }

// 目标：PostgreSQL 占位符
{ sql: 'SELECT * FROM users WHERE status = $1 AND role = $2', params: ['active', 'admin'] }
```

### 4. 事务处理接口

#### 当前模式
```javascript
const transaction = db.transaction(() => {
  // 同步操作
  stmt1.run(...);
  stmt2.run(...);
});
transaction();
```

#### 目标模式
```javascript
await dbManager.transaction(async (client) => {
  // 异步操作
  await client.query('INSERT INTO ...', [...]);
  await client.query('UPDATE ...', [...]);
});
```

## Data Models

### 表结构转换对照

#### 主要语法差异

| SQLite | PostgreSQL | 说明 |
|--------|------------|------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` | 自增主键 |
| `TEXT` | `VARCHAR(n)` 或 `TEXT` | 字符串类型 |
| `REAL` | `DECIMAL(10,4)` 或 `NUMERIC` | 精确小数 |
| `BOOLEAN` (0/1) | `BOOLEAN` (true/false) | 布尔类型 |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT NOW()` | 时间戳 |
| `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` | 忽略冲突 |

#### 表结构示例转换

**users 表**
```sql
-- SQLite
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly')),
  real_name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly')),
  real_name VARCHAR(100),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**quotations 表**
```sql
-- PostgreSQL
CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  quotation_no VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(200) NOT NULL,
  customer_region VARCHAR(100) NOT NULL,
  model_id INTEGER NOT NULL REFERENCES models(id),
  regulation_id INTEGER NOT NULL REFERENCES regulations(id),
  quantity INTEGER NOT NULL,
  freight_total DECIMAL(12,4) NOT NULL,
  freight_per_unit DECIMAL(12,4) NOT NULL,
  sales_type VARCHAR(20) NOT NULL CHECK(sales_type IN ('domestic', 'export')),
  shipping_method VARCHAR(20) CHECK(shipping_method IN ('fcl', 'fcl_20', 'fcl_40', 'lcl')),
  port VARCHAR(100),
  base_cost DECIMAL(12,4) NOT NULL,
  overhead_price DECIMAL(12,4) NOT NULL,
  final_price DECIMAL(12,4) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  packaging_config_id INTEGER REFERENCES packaging_configs(id),
  include_freight_in_base BOOLEAN DEFAULT true,
  custom_profit_tiers TEXT,
  vat_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP
);
```

### 索引设计

保留现有索引并优化：

```sql
-- 用户表索引
CREATE INDEX idx_users_username ON users(username);

-- 报价单索引
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_by ON quotations(created_by);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX idx_quotations_customer ON quotations(customer_name);

-- 报价单明细索引
CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_category ON quotation_items(category);

-- 标准成本索引
CREATE INDEX idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
CREATE INDEX idx_standard_costs_is_current ON standard_costs(is_current) WHERE is_current = true;
CREATE INDEX idx_standard_costs_sales_type ON standard_costs(sales_type);

-- 原料表索引
CREATE INDEX idx_materials_item_no ON materials(item_no);
CREATE INDEX idx_materials_manufacturer ON materials(manufacturer);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 占位符转换正确性
*For any* SQL 查询字符串包含 N 个 `?` 占位符，转换后的字符串 SHALL 包含 `$1` 到 `$N` 的连续占位符，且参数数组长度保持不变
**Validates: Requirements 2.1, 7.1**

### Property 2: Model 方法返回类型一致性
*For any* Model 的查询方法，当查询单条记录时返回对象或 null，当查询多条记录时返回数组（可能为空）
**Validates: Requirements 3.2, 3.3**

### Property 3: 事务原子性
*For any* 事务操作，如果事务中任一操作失败，则所有操作 SHALL 回滚，数据库状态与事务开始前一致
**Validates: Requirements 3.4, 4.3**

### Property 4: 数据迁移完整性
*For any* 表的数据迁移，PostgreSQL 中的记录数 SHALL 等于 SQLite 中的记录数，且主键值保持一致
**Validates: Requirements 6.2, 6.4**

### Property 5: API 响应兼容性
*For any* API 端点，迁移后的响应 JSON 结构（字段名、数据类型、嵌套结构）SHALL 与迁移前完全一致
**Validates: Requirements 9.1, 9.2**

### Property 6: 布尔值序列化一致性
*For any* 包含布尔字段的 API 响应，PostgreSQL 的 true/false SHALL 正确序列化为 JSON 的 true/false
**Validates: Requirements 9.3**

### Property 7: CHECK 约束有效性
*For any* 违反 CHECK 约束的数据插入操作，PostgreSQL SHALL 拒绝该操作并抛出约束违反错误
**Validates: Requirements 5.4**

### Property 8: 默认值正确性
*For any* 未指定值的字段插入操作，PostgreSQL SHALL 使用定义的默认值填充该字段
**Validates: Requirements 5.5**

### Property 9: 错误处理一致性
*For any* 数据库操作错误，Controller SHALL 返回包含错误信息的 HTTP 响应，状态码为 4xx 或 5xx
**Validates: Requirements 4.2**

## Error Handling

### 数据库连接错误

```javascript
class DatabaseManager {
  async initialize() {
    try {
      await this.pool.connect();
      console.log('PostgreSQL 连接成功');
    } catch (error) {
      console.error('PostgreSQL 连接失败:', error.message);
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }
}
```

### 查询错误处理

```javascript
class User {
  static async findById(id) {
    try {
      const result = await dbManager.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;  // 向上抛出，由 Controller 处理
    }
  }
}
```

### Controller 错误处理

```javascript
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }
    res.json(success(user));
  } catch (err) {
    console.error('获取用户失败:', err);
    res.status(500).json(error('获取用户失败: ' + err.message, 500));
  }
};
```

### 事务错误处理

```javascript
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
```

## Testing Strategy

### 双重测试方法

本迁移项目采用单元测试和属性测试相结合的方式：

- **单元测试**：验证具体的转换规则和边界情况
- **属性测试**：验证通用属性在各种输入下都成立

### 测试框架

- **单元测试**: Jest
- **属性测试**: fast-check
- **配置**: 每个属性测试运行 100 次迭代

### 单元测试范围

1. **DatabaseManager 测试**
   - 连接池初始化
   - 连接失败处理
   - 事务提交和回滚

2. **占位符转换测试**
   - 单个占位符
   - 多个占位符
   - 无占位符

3. **DDL 语法测试**
   - 表创建语句执行
   - 约束验证
   - 索引创建

### 属性测试范围

1. **占位符转换属性测试**
   - 生成随机数量的参数
   - 验证转换后的占位符格式

2. **数据迁移属性测试**
   - 随机选择表
   - 验证记录数一致性

3. **API 兼容性属性测试**
   - 随机 API 请求
   - 对比响应结构

### 测试标注格式

每个属性测试必须包含以下注释：
```javascript
/**
 * Feature: postgresql-migration, Property 1: 占位符转换正确性
 * Validates: Requirements 2.1, 7.1
 */
```
