# Requirements Document

## Introduction

本功能在现有的成本新增页面（CostAdd）基础上，增加"新产品成本预估"模式。通过二级菜单区分入口，业务员可以为尚未建立标准成本的新产品创建预估报价单，通过选择参考标准成本自动带出数据，在此基础上调整形成新产品的成本预估。

## Glossary

- **New_Product_Model**: 新产品型号，尚未建立标准成本的型号
- **Reference_Standard_Cost**: 参考标准成本，用户选择的已有型号的标准成本记录，作为新产品预估的数据模板
- **CostAdd_Page**: 成本新增页面，现有的报价单创建页面
- **Quotation_System**: 报价单系统，处理报价单创建、编辑、审核的核心模块
- **Navigation_System**: 导航菜单系统，管理侧边栏菜单结构和路由

## Requirements

### Requirement 1: 导航菜单二级结构

**User Story:** As a 业务员, I want to 通过不同菜单入口创建不同类型报价单, so that 操作流程更清晰直观。

#### Acceptance Criteria

1. THE Navigation_System SHALL 将"新增报价"菜单改为带子菜单的结构：
   - "现有产品报价" - 跳转到 `/cost/add`（现有功能）
   - "新产品成本预估" - 跳转到 `/cost/add?mode=estimation`
2. WHEN 用户点击"现有产品报价" THEN THE CostAdd_Page SHALL 显示现有的型号配置选择流程
3. WHEN 用户点击"新产品成本预估" THEN THE CostAdd_Page SHALL 显示新产品预估模式的字段

### Requirement 2: 新产品型号选择

**User Story:** As a 业务员, I want to 在新产品预估模式下选择新产品型号, so that 我可以为新产品创建成本预估。

#### Acceptance Criteria

1. WHEN CostAdd_Page 处于预估模式 THEN THE CostAdd_Page SHALL 显示"新产品型号"选择器替代"型号配置"选择器
2. THE CostAdd_Page SHALL 允许用户从已有型号列表中选择（筛选同法规下的型号）
3. WHEN 用户选择新产品型号后 THEN THE CostAdd_Page SHALL 启用"参考标准成本"选择器
4. THE CostAdd_Page SHALL 显示所选型号的基本信息（型号名、分类、法规）

### Requirement 3: 参考标准成本选择

**User Story:** As a 业务员, I want to 选择参考标准成本, so that 系统能自动带出参考数据作为预估基础。

#### Acceptance Criteria

1. WHEN 用户选择新产品型号后 THEN THE CostAdd_Page SHALL 显示"参考标准成本"选择器
2. THE CostAdd_Page SHALL 仅显示与新产品型号同一法规、同一分类下的标准成本列表
3. WHEN 用户选择参考标准成本 THEN THE CostAdd_Page SHALL 显示该标准成本的摘要信息（型号名、包装配置、基础成本、管销价）
4. THE CostAdd_Page SHALL 支持在同法规同分类范围内搜索参考标准成本（按型号名称）
5. IF 用户未选择参考标准成本 THEN THE CostAdd_Page SHALL 允许从空白开始创建预估（手动填写所有数据）

### Requirement 4: 参考数据自动带出

**User Story:** As a 业务员, I want to 自动获取参考标准成本的所有明细数据, so that 我可以在此基础上快速调整形成新产品预估。

#### Acceptance Criteria

1. WHEN 用户确认选择参考标准成本 THEN THE CostAdd_Page SHALL 自动复制以下数据到成本明细：
   - 原料明细（名称、用量、单价）
   - 工序明细（名称、用量、工价）
   - 包材明细（名称、用量、单价、材积）
   - 自定义费用配置
2. WHEN 数据复制完成 THEN THE CostAdd_Page SHALL 标记所有复制的数据行为"来自参考"状态，并在界面上显示该标记
3. THE Quotation_System SHALL 保留参考标准成本的ID关联
4. WHEN 复制数据后 THEN THE CostAdd_Page SHALL 自动重新计算成本汇总
5. IF 参考标准成本的原料在系统中已更新价格 THEN THE CostAdd_Page SHALL 使用最新原料价格进行计算

### Requirement 5: 预估数据编辑

**User Story:** As a 业务员, I want to 修改参考数据形成新产品预估, so that 我可以根据新产品特点调整成本结构。

#### Acceptance Criteria

1. WHEN 用户编辑复制来的数据行 THEN THE CostAdd_Page SHALL 标记该行为"已修改"状态
2. THE CostAdd_Page SHALL 允许用户添加新的原料、工序、包材行
3. THE CostAdd_Page SHALL 允许用户删除不需要的数据行
4. WHEN 用户修改任意数据 THEN THE CostAdd_Page SHALL 实时重新计算成本汇总

### Requirement 6: 预估报价单存储

**User Story:** As a 系统, I want to 正确存储预估报价单的关联信息, so that 后续可以追溯参考来源。

#### Acceptance Criteria

1. THE Quotation_System SHALL 在报价单主表中存储 `is_estimation` 标识（是否为预估报价单）
2. THE Quotation_System SHALL 在报价单主表中存储 `reference_standard_cost_id`（参考标准成本ID）
3. WHEN 显示报价单详情 THEN THE Quotation_System SHALL 显示参考标准成本的来源信息
4. THE Quotation_System SHALL 在报价单列表中以标签区分显示预估类型报价单
