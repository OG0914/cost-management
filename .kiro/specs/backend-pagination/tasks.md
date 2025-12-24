# Implementation Plan: Backend Pagination

## Overview

本实现计划将后端分页优化分为 4 个阶段：QueryBuilder 增强、后端接口改造、前端页面改造、测试验证。采用渐进式改造策略，每完成一个页面即可独立验证。

## Tasks

- [x] 1. QueryBuilder 工具类增强
  - [x] 1.1 实现 whereLikeOr 方法
    - 在 `backend/utils/queryBuilder.js` 中添加 `whereLikeOr(fields, value)` 方法
    - 支持多字段 OR 模糊匹配
    - 空值时跳过条件
    - 正确处理 PostgreSQL 占位符索引
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [-]* 1.2 编写 QueryBuilder 单元测试
    - 测试 whereLikeOr 单字段和多字段场景
    - 测试空值跳过逻辑
    - 测试与其他条件组合使用时的占位符索引

  - [ ]* 1.3 编写 QueryBuilder 属性测试
    - **Property 6: QueryBuilder SQL 生成正确性**
    - **Validates: Requirements 6.2, 6.3**

- [x] 2. 后端原料管理接口改造
  - [x] 2.1 改造 materialController.getAllMaterials
    - 接收 page、pageSize、keyword 参数
    - 使用 QueryBuilder 构建分页查询
    - 支持按品号或原料名称模糊搜索
    - 返回 paginated 格式响应
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2_

  - [ ]* 2.2 编写原料分页接口属性测试
    - **Property 1: 分页响应格式一致性**
    - **Property 3: 搜索结果匹配性**
    - **Validates: Requirements 1.4, 1.5, 2.2**

- [x] 3. 前端原料管理页面改造
  - [x] 3.1 改造 MaterialManage.vue 分页逻辑
    - 移除一次性加载全量数据逻辑
    - 实现后端分页请求
    - 页码/每页条数变化时重新请求
    - 搜索时重置到第一页
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 3.2 实现搜索防抖
    - 使用 VueUse 的 useDebounceFn 或自定义实现
    - 300ms 防抖延迟
    - 清空搜索框时立即触发查询
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Checkpoint - 原料管理分页验证
  - 确保原料管理页面分页功能正常
  - 验证搜索、翻页、切换每页条数功能
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 后端成本记录接口改造
  - [x] 5.1 改造 costController.getQuotationList
    - 确认现有分页逻辑是否完整
    - 添加 keyword 参数支持多字段搜索
    - 支持按报价单编号、客户名称、型号搜索
    - _Requirements: 3.2, 3.4_

  - [ ]* 5.2 编写成本记录分页接口属性测试
    - **Property 3: 搜索结果匹配性**
    - **Property 4: 排序正确性**
    - **Validates: Requirements 3.2, 3.4**

- [x] 6. 前端成本记录页面改造
  - [x] 6.1 改造 CostRecords.vue 分页逻辑
    - 移除一次性加载全量数据逻辑
    - 实现后端分页请求
    - 保持搜索条件在翻页时不丢失
    - _Requirements: 3.1, 3.3, 3.5_

  - [x] 6.2 实现搜索防抖
    - 与原料管理页面保持一致的防抖逻辑
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Checkpoint - 成本记录分页验证
  - 确保成本记录页面分页功能正常
  - 验证搜索、翻页功能
  - 确保所有测试通过，如有问题请询问用户

- [x] 8. 后端审核列表接口改造
  - [x] 8.1 改造 reviewController.getPendingList
    - 添加 keyword 参数支持多字段搜索
    - 确保只返回 status='submitted' 的记录
    - _Requirements: 4.1, 4.3_

  - [x] 8.2 改造 reviewController.getApprovedList
    - 添加 keyword 参数支持多字段搜索
    - 确保只返回 status='approved' 或 'rejected' 的记录
    - _Requirements: 4.2, 4.3_

  - [ ]* 8.3 编写审核列表分页接口属性测试
    - **Property 5: 状态过滤正确性**
    - **Validates: Requirements 4.1, 4.2**

- [x] 9. 前端审核列表页面改造
  - [x] 9.1 改造 PendingReview.vue 分页逻辑
    - 移除一次性加载全量数据逻辑
    - 实现后端分页请求
    - _Requirements: 4.1, 4.3_

  - [x] 9.2 改造 ApprovedReview.vue 分页逻辑
    - 移除一次性加载全量数据逻辑
    - 实现后端分页请求
    - _Requirements: 4.2, 4.3_

  - [x] 9.3 实现搜索防抖
    - 两个页面统一使用防抖搜索
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Checkpoint - 审核列表分页验证
  - 确保待审核和已审核页面分页功能正常
  - 验证状态过滤是否正确
  - 确保所有测试通过，如有问题请询问用户

- [x] 11. 最终验证和清理
  - [x] 11.1 全量功能回归测试
    - 验证所有改造页面的分页、搜索、排序功能
    - 验证边界情况（空数据、单页数据、大量数据）

  - [x] 11.2 清理冗余代码
    - 移除前端不再使用的前端分页相关代码
    - 确保没有遗留的 pageSize: 9999 调用

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 每个 Checkpoint 是验证点，确保阶段性成果可用
- 改造顺序：原料管理 → 成本记录 → 审核列表，由简到繁
- 前端防抖统一使用 300ms 延迟
- 后端分页默认 pageSize=20，最大限制 100
