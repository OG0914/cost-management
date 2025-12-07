# Requirements Document

## Introduction

本文档定义了将成本计算系统的数据库从 SQLite 迁移到 PostgreSQL 的需求规范。当前系统使用 better-sqlite3 作为数据库驱动，采用同步查询模式。迁移后将使用 pg 驱动和连接池，采用异步查询模式，以支持生产环境的多用户并发访问、数据完整性保障和更好的查询性能。

## Glossary

- **SQLite**: 当前使用的轻量级嵌入式数据库，数据存储在单个文件中
- **PostgreSQL**: 目标数据库，企业级开源关系型数据库管理系统
- **better-sqlite3**: 当前使用的 Node.js SQLite 驱动，采用同步 API
- **pg**: PostgreSQL 的 Node.js 驱动，采用异步 API
- **连接池 (Connection Pool)**: 预先建立并复用数据库连接的机制，提高性能
- **DDL (Data Definition Language)**: 数据定义语言，用于创建、修改表结构的 SQL 语句
- **DML (Data Manipulation Language)**: 数据操作语言，用于增删改查数据的 SQL 语句
- **占位符 (Placeholder)**: SQL 语句中用于参数化查询的标记，SQLite 使用 `?`，PostgreSQL 使用 `$1, $2...`
- **事务 (Transaction)**: 一组原子性操作，要么全部成功，要么全部回滚
- **Model 层**: 后端的数据访问层，封装数据库操作逻辑

## Requirements

### Requirement 1: 数据库连接层重构

**User Story:** As a 开发者, I want to 将数据库连接从 SQLite 切换到 PostgreSQL, so that 系统可以支持生产环境的并发访问和数据安全需求。

#### Acceptance Criteria

1. WHEN 系统启动时 THEN DatabaseManager SHALL 使用 pg 驱动建立 PostgreSQL 连接池
2. WHEN 连接池初始化时 THEN DatabaseManager SHALL 配置最小连接数为 2，最大连接数为 20
3. WHEN 数据库连接失败时 THEN DatabaseManager SHALL 记录错误日志并抛出明确的错误信息
4. WHEN 应用关闭时 THEN DatabaseManager SHALL 正确关闭所有连接池连接
5. WHEN 环境变量配置数据库连接信息时 THEN DatabaseManager SHALL 从 DATABASE_URL 或独立的 PGHOST、PGPORT、PGUSER、PGPASSWORD、PGDATABASE 环境变量读取配置

### Requirement 2: SQL 语法适配

**User Story:** As a 开发者, I want to 将所有 SQL 语句从 SQLite 语法转换为 PostgreSQL 语法, so that 查询可以在 PostgreSQL 上正确执行。

#### Acceptance Criteria

1. WHEN 执行参数化查询时 THEN 系统 SHALL 将占位符从 `?` 转换为 `$1, $2, $3...` 格式
2. WHEN 创建自增主键时 THEN DDL 语句 SHALL 使用 `SERIAL` 或 `BIGSERIAL` 替代 `INTEGER PRIMARY KEY AUTOINCREMENT`
3. WHEN 存储布尔值时 THEN 系统 SHALL 使用 PostgreSQL 原生 `BOOLEAN` 类型替代 `0/1` 整数
4. WHEN 执行 UPSERT 操作时 THEN 系统 SHALL 使用 `ON CONFLICT ... DO UPDATE` 替代 `INSERT OR IGNORE`
5. WHEN 获取插入记录的 ID 时 THEN 系统 SHALL 使用 `RETURNING id` 子句替代 `lastInsertRowid`

### Requirement 3: Model 层异步化改造

**User Story:** As a 开发者, I want to 将所有 Model 层的同步方法改造为异步方法, so that 系统可以高效处理并发请求而不阻塞事件循环。

#### Acceptance Criteria

1. WHEN Model 方法执行数据库查询时 THEN 该方法 SHALL 返回 Promise 并使用 async/await 语法
2. WHEN 查询单条记录时 THEN Model 方法 SHALL 返回单个对象或 null
3. WHEN 查询多条记录时 THEN Model 方法 SHALL 返回数组（可能为空数组）
4. WHEN 执行事务操作时 THEN Model 方法 SHALL 使用 pg 的事务 API 确保原子性
5. WHEN Model 方法发生数据库错误时 THEN 该方法 SHALL 抛出包含原始错误信息的异常

### Requirement 4: Controller 层适配

**User Story:** As a 开发者, I want to 更新所有 Controller 以正确调用异步化的 Model 方法, so that API 请求可以正确处理异步数据库操作。

#### Acceptance Criteria

1. WHEN Controller 调用 Model 方法时 THEN Controller SHALL 使用 await 关键字等待结果
2. WHEN 数据库操作失败时 THEN Controller SHALL 捕获异常并返回适当的 HTTP 错误响应
3. WHEN 执行多个相关数据库操作时 THEN Controller SHALL 确保操作在同一事务中执行

### Requirement 5: 表结构迁移

**User Story:** As a 开发者, I want to 将现有的 SQLite 表结构转换为 PostgreSQL 兼容的 DDL, so that 数据库 schema 可以在 PostgreSQL 上正确创建。

#### Acceptance Criteria

1. WHEN 创建表结构时 THEN DDL 脚本 SHALL 包含所有 16 张现有表的 PostgreSQL 兼容定义
2. WHEN 定义外键约束时 THEN DDL 脚本 SHALL 保留所有现有的外键关系和级联删除规则
3. WHEN 创建索引时 THEN DDL 脚本 SHALL 包含所有现有索引的 PostgreSQL 兼容定义
4. WHEN 定义 CHECK 约束时 THEN DDL 脚本 SHALL 保留所有现有的数据验证规则
5. WHEN 设置默认值时 THEN DDL 脚本 SHALL 使用 PostgreSQL 兼容的默认值语法

### Requirement 6: 数据迁移

**User Story:** As a 开发者, I want to 将现有 SQLite 数据库中的数据迁移到 PostgreSQL, so that 系统切换后保留所有历史数据。

#### Acceptance Criteria

1. WHEN 执行数据迁移时 THEN 迁移脚本 SHALL 导出 SQLite 中所有表的数据
2. WHEN 导入数据到 PostgreSQL 时 THEN 迁移脚本 SHALL 保持数据的完整性和关联关系
3. WHEN 迁移包含外键的表时 THEN 迁移脚本 SHALL 按照依赖顺序导入数据
4. WHEN 迁移完成后 THEN 系统 SHALL 验证 PostgreSQL 中的记录数与 SQLite 一致

### Requirement 7: 查询构建器适配

**User Story:** As a 开发者, I want to 更新 QueryBuilder 工具类以支持 PostgreSQL 语法, so that 动态查询可以正确生成 PostgreSQL 兼容的 SQL。

#### Acceptance Criteria

1. WHEN QueryBuilder 生成参数化查询时 THEN 输出 SHALL 使用 `$1, $2...` 占位符格式
2. WHEN QueryBuilder 生成日期比较条件时 THEN 输出 SHALL 使用 PostgreSQL 兼容的日期函数
3. WHEN QueryBuilder 生成 LIKE 查询时 THEN 输出 SHALL 使用 PostgreSQL 兼容的语法

### Requirement 8: 环境配置

**User Story:** As a 运维人员, I want to 通过环境变量配置数据库连接, so that 可以在不同环境（开发、测试、生产）使用不同的数据库配置。

#### Acceptance Criteria

1. WHEN 部署到生产环境时 THEN 系统 SHALL 从环境变量读取数据库连接字符串
2. WHEN 环境变量未设置时 THEN 系统 SHALL 使用合理的开发环境默认值
3. WHEN 配置连接池参数时 THEN 系统 SHALL 支持通过环境变量自定义连接池大小

### Requirement 9: 向后兼容性

**User Story:** As a 开发者, I want to 确保 API 接口在迁移后保持不变, so that 前端代码无需修改即可正常工作。

#### Acceptance Criteria

1. WHEN 前端调用 API 时 THEN 响应格式 SHALL 与迁移前保持完全一致
2. WHEN API 返回数据时 THEN 字段名称和数据类型 SHALL 与迁移前保持一致
3. WHEN 处理布尔字段时 THEN API 响应 SHALL 将 PostgreSQL 的 true/false 正确转换为 JSON 布尔值
