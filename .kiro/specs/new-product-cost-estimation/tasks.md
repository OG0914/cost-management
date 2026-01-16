# Implementation Plan: 新产品成本预估

## Overview

本实施计划将"新产品成本预估"功能分解为可执行的编码任务，按照数据库 → 后端 → 前端的顺序实现，确保每个步骤都可验证。

## Tasks

- [x] 1. 数据库变更
  - [x] 1.1 创建数据库迁移脚本
    - 在 `backend/db/migrations/` 创建迁移文件
    - 添加 `is_estimation` 字段 (BOOLEAN DEFAULT false)
    - 添加 `reference_standard_cost_id` 字段 (INTEGER REFERENCES standard_costs(id))
    - 创建索引 `idx_quotations_is_estimation`
    - _Requirements: 6.1, 6.2_

- [x] 2. 后端 API 变更
  - [x] 2.1 更新 Quotation 模型
    - 修改 `backend/models/Quotation.js`
    - 在 `create` 方法中添加新字段处理
    - 在 `update` 方法中添加新字段处理
    - 在 `findById` 查询中包含新字段
    - _Requirements: 6.1, 6.2_

  - [x] 2.2 更新报价单控制器
    - 修改 `backend/controllers/cost/quotationCrudController.js`
    - 在创建接口中接收并保存 `is_estimation` 和 `reference_standard_cost_id`
    - 在详情接口中返回参考标准成本信息
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.3 更新标准成本筛选 API
    - 修改 `backend/models/StandardCost.js`
    - 修改 `backend/controllers/review/standardCostController.js`
    - 添加按 `regulation_id` 和 `model_category` 筛选的支持
    - _Requirements: 3.2, 3.4_

- [x] 3. 前端菜单配置
  - [x] 3.1 更新菜单配置
    - 修改 `frontend/src/config/menuConfig.js`
    - 将"新增报价"改为带子菜单结构
    - 添加"现有产品报价"和"新产品成本预估"两个子菜单项
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. 前端 CostAdd 页面变更
  - [x] 4.1 添加预估模式判断逻辑
    - 修改 `frontend/src/views/cost/CostAdd.vue`
    - 添加 `isEstimationMode` 计算属性
    - 添加预估模式相关的响应式变量
    - _Requirements: 1.3, 2.1_

  - [x] 4.2 实现新产品型号选择器
    - 在基本信息区域添加"新产品型号"选择器（预估模式下显示）
    - 实现型号列表加载（按法规筛选）
    - 选择型号后启用参考标准成本选择器
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 实现参考标准成本选择器
    - 添加"参考标准成本"选择器
    - 调用后端 API 获取同法规同分类的标准成本列表
    - 显示标准成本摘要信息
    - 支持搜索功能
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.4 实现数据复制逻辑
    - 选择参考标准成本后调用现有的 `loadStandardCostData` 函数
    - 复制原料、工序、包材、自定义费用数据
    - 标记复制的数据行为"来自参考"状态
    - 自动重新计算成本汇总
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.5 实现数据修改标记
    - 编辑复制来的数据行时标记为"已修改"状态
    - 在界面上显示"来自参考"和"已修改"标记
    - _Requirements: 5.1_

  - [x] 4.6 更新保存逻辑
    - 保存时传递 `is_estimation` 和 `reference_standard_cost_id` 字段
    - _Requirements: 6.1, 6.2_

- [ ] 5. Checkpoint - 核心功能验证
  - 确保所有核心功能正常工作
  - 测试完整流程：菜单入口 → 选择型号 → 选择参考标准成本 → 数据带出 → 保存
  - 如有问题，询问用户

- [ ] 6. 报价单列表显示优化
  - [ ] 6.1 更新报价单列表显示
    - 修改 `frontend/src/views/cost/CostRecords.vue`
    - 在列表中显示预估类型标签
    - 添加按报价类型筛选功能
    - _Requirements: 6.4_

  - [ ] 6.2 更新报价单详情显示
    - 修改 `frontend/src/views/cost/CostDetail.vue`
    - 显示参考标准成本来源信息
    - _Requirements: 6.3_

- [ ] 7. Final Checkpoint - 完整功能验证
  - 确保所有功能正常工作
  - 验证报价单列表和详情页的显示
  - 如有问题，询问用户

## Notes

- 任务按照数据库 → 后端 → 前端的顺序执行，确保依赖关系正确
- 核心功能（任务1-4）完成后进行第一次验证
- 列表显示优化（任务6）可以在核心功能验证通过后再实现
- 复用现有的 `loadStandardCostData` 和 `fillStandardCostData` 函数，减少代码重复
