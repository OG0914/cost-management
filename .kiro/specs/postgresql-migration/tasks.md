# Implementation Plan

## Phase 1: 基础设施准备

- [x] 1. 更新项目依赖




  - [x] 1.1 安装 PostgreSQL 驱动和相关依赖


    - 安装 `pg` 包作为 PostgreSQL 驱动
    - 安装 `pg-format` 用于安全的 SQL 格式化（可选）
    - 移除 `better-sqlite3` 依赖（迁移完成后）
    - _Requirements: 1.1_


  - [ ] 1.2 更新环境变量配置
    - 在 `backend/.env` 中添加 PostgreSQL 连接配置
    - 创建 `.env.example` 文件作为配置模板
    - _Requirements: 8.1, 8.2_

## Phase 2: 数据库连接层重构

- [x] 2. 重写 DatabaseManager


  - [x] 2.1 创建新的 PostgreSQL 连接管理器



    - 使用 pg Pool 创建连接池
    - 实现 `initialize()` 异步初始化方法
    - 实现 `getPool()` 获取连接池实例
    - 实现 `close()` 关闭连接池
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.2 实现查询封装方法



    - 实现 `query(sql, params)` 方法，自动转换占位符
    - 实现占位符转换函数：`?` → `$1, $2...`
    - _Requirements: 2.1_

  - [ ]* 2.3 编写占位符转换属性测试
    - **Property 1: 占位符转换正确性**
    - **Validates: Requirements 2.1, 7.1**

  - [x] 2.4 实现事务支持



    - 实现 `transaction(fn)` 方法
    - 确保事务失败时正确回滚
    - _Requirements: 3.4_

  - [ ]* 2.5 编写事务原子性属性测试
    - **Property 3: 事务原子性**
    - **Validates: Requirements 3.4, 4.3**

- [x] 3. Checkpoint - 确保数据库连接层测试通过



  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: DDL 转换

- [x] 4. 转换表结构定义

  - [x] 4.1 创建 PostgreSQL DDL 脚本



    - 转换所有 16 张表的 CREATE TABLE 语句
    - 将 `INTEGER PRIMARY KEY AUTOINCREMENT` 改为 `SERIAL PRIMARY KEY`
    - 将 `TEXT` 改为适当的 `VARCHAR(n)` 或保持 `TEXT`
    - 将 `REAL` 改为 `DECIMAL(12,4)` 用于金额字段
    - 将 `BOOLEAN DEFAULT 1/0` 改为 `BOOLEAN DEFAULT true/false`
    - 将 `DATETIME DEFAULT CURRENT_TIMESTAMP` 改为 `TIMESTAMP DEFAULT NOW()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.2 转换索引定义



    - 转换所有现有索引为 PostgreSQL 语法
    - 添加部分索引优化（如 `WHERE is_current = true`）
    - _Requirements: 5.3_

  - [x] 4.3 转换默认数据插入语句



    - 将 `INSERT OR IGNORE` 改为 `ON CONFLICT DO NOTHING`
    - 转换系统配置默认值插入语句
    - _Requirements: 2.4_

  - [ ]* 4.4 编写 CHECK 约束属性测试
    - **Property 7: CHECK 约束有效性**
    - **Validates: Requirements 5.4**

  - [ ]* 4.5 编写默认值属性测试
    - **Property 8: 默认值正确性**
    - **Validates: Requirements 5.5**

## Phase 4: QueryBuilder 适配


- [ ] 5. 更新 QueryBuilder 工具类
  - [x] 5.1 修改 buildSelect 和 buildCount 方法



    - 将占位符从 `?` 改为 `$n` 格式
    - 更新参数索引计数逻辑
    - _Requirements: 7.1_

  - [x] 5.2 更新日期函数语法



    - 将 `DATE(field)` 改为 PostgreSQL 兼容语法
    - _Requirements: 7.2_

  - [ ]* 5.3 编写 QueryBuilder 单元测试
    - 测试各种查询条件组合
    - 验证生成的 SQL 语法正确
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Checkpoint - 确保 QueryBuilder 测试通过



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Model 层异步化改造


- [ ] 7. 改造基础 Model 文件
  - [x] 7.1 改造 User.js



    - 将所有方法改为 async
    - 更新 SQL 占位符格式
    - 使用 `result.rows` 获取查询结果
    - 使用 `RETURNING id` 获取插入 ID
    - _Requirements: 3.1, 3.2, 3.3, 2.5_

  - [x] 7.2 改造 Regulation.js



    - 将所有方法改为 async
    - 更新查询语法
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.3 改造 Model.js（型号表）



    - 将所有方法改为 async
    - 更新查询语法
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.4 改造 Material.js



    - 将所有方法改为 async
    - 更新批量插入逻辑
    - 更新事务处理
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.5 改造 SystemConfig.js



    - 将所有方法改为 async
    - 更新 UPSERT 语法为 `ON CONFLICT DO UPDATE`
    - _Requirements: 3.1, 2.4_


- [ ] 8. 改造报价相关 Model 文件
  - [x] 8.1 改造 Quotation.js



    - 将所有方法改为 async
    - 更新复杂查询语法
    - 更新事务处理（删除报价单）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.2 改造 QuotationItem.js



    - 将所有方法改为 async
    - 更新批量插入逻辑
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.3 改造 QuotationCustomFee.js



    - 将所有方法改为 async
    - 更新事务处理
    - _Requirements: 3.1, 3.4_


- [ ] 9. 改造包装配置相关 Model 文件
  - [x] 9.1 改造 PackagingConfig.js


    - 将所有方法改为 async
    - _Requirements: 3.1, 3.2, 3.3_



  - [x] 9.2 改造 PackagingMaterial.js

    - 将所有方法改为 async


    - _Requirements: 3.1, 3.2, 3.3_





  - [x] 9.3 改造 ProcessConfig.js
    - 将所有方法改为 async
    - _Requirements: 3.1, 3.2, 3.3_


  - [x] 9.4 改造 StandardCost.js
    - 将所有方法改为 async
    - 更新事务处理（版本控制）
    - _Requirements: 3.1, 3.4_

  - [ ]* 9.5 编写 Model 返回类型属性测试
    - **Property 2: Model 方法返回类型一致性**
    - **Validates: Requirements 3.2, 3.3**


- [x] 10. Checkpoint - 确保 Model 层测试通过


  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Controller 层适配

- [x] 11. 更新 Controller 文件


  - [x] 11.1 更新 authController.js


    - 添加 async/await 调用
    - 更新错误处理
    - _Requirements: 4.1, 4.2_


  - [x] 11.2 更新 costController.js


    - 添加 async/await 调用
    - 更新事务处理
    - _Requirements: 4.1, 4.2, 4.3_


  - [x] 11.3 更新 materialController.js

    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_

  - [x] 11.4 更新 modelController.js


    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_


  - [x] 11.5 更新 processController.js



    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_


  - [x] 11.6 更新 regulationController.js
    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_



  - [x] 11.7 更新 configController.js
    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_




  - [x] 11.8 更新 standardCostController.js
    - 添加 async/await 调用
    - _Requirements: 4.1, 4.2_

  - [ ]* 11.9 编写错误处理属性测试
    - **Property 9: 错误处理一致性**
    - **Validates: Requirements 4.2**


- [ ] 12. Checkpoint - 确保 Controller 层测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: 服务器启动流程更新

- [x] 13. 更新服务器启动逻辑




  - [x] 13.1 修改 server.js


    - 将数据库初始化改为异步
    - 确保数据库连接成功后再启动 HTTP 服务
    - 添加优雅关闭逻辑
    - _Requirements: 1.1, 1.3, 1.4_

## Phase 8: 数据迁移

- [x] 14. 创建数据迁移脚本



  - [x] 14.1 编写数据导出脚本


    - 从 SQLite 导出所有表数据为 JSON
    - 按依赖顺序排列表
    - _Requirements: 6.1, 6.3_



  - [x] 14.2 编写数据导入脚本

    - 将 JSON 数据导入 PostgreSQL
    - 处理外键依赖顺序
    - 重置序列值（SERIAL）


    - _Requirements: 6.2, 6.3_


  - [x] 14.3 编写数据验证脚本
    - 比对两个数据库的记录数
    - 验证关键数据一致性
    - _Requirements: 6.4_

  - [ ]* 14.4 编写数据迁移完整性属性测试
    - **Property 4: 数据迁移完整性**
    - **Validates: Requirements 6.2, 6.4**


- [x] 15. Checkpoint - 确保数据迁移测试通过

  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: API 兼容性验证

- [x] 16. 验证 API 兼容性




  - [x] 16.1 验证布尔值序列化

    - 确保 PostgreSQL 布尔值正确转换为 JSON
    - 检查 `is_active`、`is_changed`、`after_overhead` 等字段
    - _Requirements: 9.3_

  - [ ]* 16.2 编写 API 兼容性属性测试
    - **Property 5: API 响应兼容性**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 16.3 编写布尔值序列化属性测试
    - **Property 6: 布尔值序列化一致性**
    - **Validates: Requirements 9.3**

## Phase 10: 清理和文档

- [x] 17. 项目清理



  - [x] 17.1 移除 SQLite 相关代码和依赖



    - 从 package.json 移除 `better-sqlite3`
    - 删除或归档 SQLite 数据库文件
    - 更新 .gitignore
    - _Requirements: 1.1_

  - [x] 17.2 更新项目文档


    - 更新 README 中的数据库配置说明
    - 添加 PostgreSQL 安装和配置指南
    - _Requirements: 8.1_




- [ ] 18. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
