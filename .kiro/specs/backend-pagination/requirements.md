# Requirements Document

## Introduction

优化项目的分页机制，将当前的前端分页模式改造为后端分页模式。当前系统在列表页面一次性加载全量数据到前端，随着数据量增长会导致性能问题。本次改造将实现真正的服务端分页、搜索和排序功能。

## Glossary

- **Backend_Pagination**: 后端分页，指在数据库层面通过 LIMIT/OFFSET 实现的分页查询
- **Frontend_Pagination**: 前端分页，指将全量数据加载到浏览器后在内存中切片显示
- **Debounce**: 防抖，用户停止输入一段时间后才触发搜索请求的技术
- **QueryBuilder**: 项目中已有的 SQL 查询构建器工具类
- **Paginated_Response**: 分页响应格式，包含 data、total、page、pageSize 字段

## Requirements

### Requirement 1: 后端分页查询接口

**User Story:** As a 开发者, I want 统一的后端分页查询接口, so that 所有列表页面可以高效地按需加载数据。

#### Acceptance Criteria

1. WHEN 前端请求列表数据时, THE Backend_Pagination SHALL 接受 page、pageSize、keyword、sortField、sortOrder 参数
2. WHEN pageSize 参数缺失时, THE Backend_Pagination SHALL 使用默认值 20
3. WHEN page 参数缺失时, THE Backend_Pagination SHALL 使用默认值 1
4. THE Backend_Pagination SHALL 返回包含 data、total、page、pageSize 的 Paginated_Response 格式
5. WHEN 执行分页查询时, THE Backend_Pagination SHALL 同时返回符合条件的总记录数

### Requirement 2: 原料管理分页

**User Story:** As a 采购人员, I want 原料列表支持后端分页和搜索, so that 即使原料数量很多也能快速加载和查找。

#### Acceptance Criteria

1. WHEN 访问原料管理页面时, THE System SHALL 仅加载第一页数据（默认20条）
2. WHEN 用户输入搜索关键词时, THE System SHALL 在后端按品号或原料名称进行模糊匹配
3. WHEN 用户切换页码或每页条数时, THE System SHALL 向后端请求对应页的数据
4. WHEN 搜索条件变化时, THE System SHALL 自动重置到第一页
5. THE System SHALL 显示正确的总记录数和总页数

### Requirement 3: 成本记录分页

**User Story:** As a 业务员, I want 成本记录列表支持后端分页和搜索, so that 能快速找到需要的报价单。

#### Acceptance Criteria

1. WHEN 访问成本记录页面时, THE System SHALL 仅加载第一页数据
2. WHEN 用户输入搜索关键词时, THE System SHALL 在后端按报价单编号、客户名称或型号进行模糊匹配
3. WHEN 用户切换页码时, THE System SHALL 保持当前的搜索条件
4. THE System SHALL 按创建时间倒序排列结果
5. WHEN 数据正在加载时, THE System SHALL 显示加载状态

### Requirement 4: 审核列表分页

**User Story:** As a 审核人员, I want 待审核和已审核列表支持后端分页, so that 能高效处理大量审核任务。

#### Acceptance Criteria

1. WHEN 访问待审核页面时, THE System SHALL 仅加载状态为 submitted 的第一页数据
2. WHEN 访问已审核页面时, THE System SHALL 仅加载状态为 approved 或 rejected 的第一页数据
3. WHEN 用户搜索时, THE System SHALL 支持按报价单编号、客户名称、型号进行后端搜索
4. THE System SHALL 按提交时间或审核时间倒序排列

### Requirement 5: 搜索防抖优化

**User Story:** As a 用户, I want 搜索输入有防抖处理, so that 不会因为快速输入而产生大量无效请求。

#### Acceptance Criteria

1. WHEN 用户在搜索框输入时, THE System SHALL 等待用户停止输入 300ms 后再发起请求
2. WHEN 用户在防抖等待期间继续输入时, THE System SHALL 重置等待计时器
3. WHEN 用户清空搜索框时, THE System SHALL 立即触发无条件查询
4. WHEN 搜索请求发起时, THE System SHALL 显示加载指示器

### Requirement 6: QueryBuilder 增强

**User Story:** As a 后端开发者, I want QueryBuilder 支持多字段 OR 搜索, so that 可以方便地实现关键词搜索功能。

#### Acceptance Criteria

1. THE QueryBuilder SHALL 提供 whereLikeOr 方法支持多字段模糊匹配
2. WHEN 调用 whereLikeOr 时, THE QueryBuilder SHALL 生成正确的 PostgreSQL OR 条件语句
3. THE QueryBuilder SHALL 正确处理参数占位符索引
4. WHEN 搜索值为空时, THE QueryBuilder SHALL 跳过该条件不添加到查询中
