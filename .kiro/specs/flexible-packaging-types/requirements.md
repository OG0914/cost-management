# Requirements Document

## Introduction

本文档定义了成本计算系统中灵活包装类型功能的需求规范。当前系统仅支持固定的三层包装结构（袋→盒→箱），无法满足不同产品的多样化包装需求。本功能将扩展系统以支持多种预定义的包装类型，包括标准彩盒、无彩盒、泡壳直装和泡壳袋装等，同时保持工序和包材的关联关系不变。

## Glossary

- **包装配置 (Packaging Config)**: 型号+配置名称+包装类型+包装方式的组合，关联工序列表和包材列表
- **包装类型 (Packaging Type)**: 预定义的包装结构模板，如标准彩盒、无彩盒、泡壳直装、泡壳袋装
- **包装方式 (Packaging Method)**: 具体的包装层级数量配置，如 10pc/袋, 5袋/盒, 20盒/箱
- **标准彩盒**: 三层包装结构，袋→盒→箱
- **无彩盒**: 两层包装结构，袋→箱（无中间彩盒层）
- **泡壳直装**: 两层包装结构，泡壳→箱（产品直接放入泡壳）
- **泡壳袋装**: 三层包装结构，袋→泡壳→箱（产品先装袋再放入泡壳）
- **配置名称 (Config Name)**: 用于区分生产地点的标识，如"深圳厂"、"东莞厂"
- **工序管理**: 创建和管理包装配置及其工序列表的功能模块
- **包材管理**: 管理包装配置对应包材明细的功能模块

## Requirements

### Requirement 1: 数据库结构扩展

**User Story:** As a 开发者, I want to 扩展包装配置表以支持多种包装类型, so that 系统可以存储和区分不同的包装结构。

#### Acceptance Criteria

1. WHEN 创建包装配置时 THEN packaging_configs 表 SHALL 包含 packaging_type 字段用于存储包装类型标识
2. WHEN 存储包装类型时 THEN 系统 SHALL 支持四种预定义值：standard_box（标准彩盒）、no_box（无彩盒）、blister_direct（泡壳直装）、blister_bag（泡壳袋装）
3. WHEN 存储包装方式时 THEN 系统 SHALL 使用通用字段 layer1_qty、layer2_qty、layer3_qty 替代原有的 pc_per_bag、bags_per_box、boxes_per_carton
4. WHEN 迁移现有数据时 THEN 系统 SHALL 将所有现有配置的 packaging_type 设置为 standard_box

### Requirement 2: 工序管理页面增强

**User Story:** As a 生产人员, I want to 在创建工序配置时选择包装类型, so that 我可以为不同包装结构配置对应的工序。

#### Acceptance Criteria

1. WHEN 用户新增工序配置时 THEN 系统 SHALL 显示包装类型选择器，包含四种预定义选项
2. WHEN 用户选择包装类型后 THEN 系统 SHALL 根据类型动态显示对应的包装方式输入字段
3. WHEN 用户选择"标准彩盒"时 THEN 系统 SHALL 显示三个输入框：每袋数量、每盒袋数、每箱盒数
4. WHEN 用户选择"无彩盒"时 THEN 系统 SHALL 显示两个输入框：每袋数量、每箱袋数
5. WHEN 用户选择"泡壳直装"时 THEN 系统 SHALL 显示两个输入框：每泡壳数量、每箱泡壳数
6. WHEN 用户选择"泡壳袋装"时 THEN 系统 SHALL 显示三个输入框：每袋数量、每泡壳袋数、每箱泡壳数
7. WHEN 用户填写包装方式后 THEN 系统 SHALL 自动计算并显示每箱总数
8. WHEN 工序配置列表显示时 THEN 系统 SHALL 在表格中显示包装类型列
9. WHEN 用户筛选配置时 THEN 系统 SHALL 支持按包装类型进行筛选

### Requirement 3: 包材管理页面适配

**User Story:** As a 采购人员, I want to 在包材管理页面查看包装类型信息, so that 我可以为正确的包装配置添加包材。

#### Acceptance Criteria

1. WHEN 包材管理列表显示时 THEN 系统 SHALL 显示从工序管理继承的包装类型信息
2. WHEN 用户编辑包材时 THEN 系统 SHALL 以只读方式显示配置的包装类型和包装方式
3. WHEN 用户筛选配置时 THEN 系统 SHALL 支持按包装类型进行筛选
4. WHEN 显示包装方式时 THEN 系统 SHALL 根据包装类型使用正确的单位标签（袋/盒/箱 或 袋/泡壳/箱）

### Requirement 4: 报价单页面适配

**User Story:** As a 销售人员, I want to 在创建报价单时按包装类型分组选择配置, so that 我可以快速找到需要的包装配置。

#### Acceptance Criteria

1. WHEN 用户选择包装配置时 THEN 下拉菜单 SHALL 按包装类型分组显示选项
2. WHEN 显示分组标题时 THEN 系统 SHALL 使用中文名称：标准彩盒、无彩盒、泡壳直装、泡壳袋装
3. WHEN 显示配置选项时 THEN 系统 SHALL 显示配置名称和包装方式摘要
4. WHEN 用户选择配置后 THEN 系统 SHALL 显示完整的配置信息，包括包装类型、包装方式、每箱数量

### Requirement 5: 包装方式显示格式化

**User Story:** As a 用户, I want to 看到符合包装类型的包装方式描述, so that 我可以清楚理解包装结构。

#### Acceptance Criteria

1. WHEN 显示标准彩盒包装方式时 THEN 系统 SHALL 使用格式：Xpc/袋, Y袋/盒, Z盒/箱
2. WHEN 显示无彩盒包装方式时 THEN 系统 SHALL 使用格式：Xpc/袋, Y袋/箱
3. WHEN 显示泡壳直装包装方式时 THEN 系统 SHALL 使用格式：Xpc/泡壳, Y泡壳/箱
4. WHEN 显示泡壳袋装包装方式时 THEN 系统 SHALL 使用格式：Xpc/袋, Y袋/泡壳, Z泡壳/箱
5. WHEN 计算每箱总数时 THEN 系统 SHALL 根据包装类型正确计算各层数量的乘积

### Requirement 6: Excel 导入导出适配

**User Story:** As a 管理员, I want to 通过 Excel 批量导入包含包装类型的配置, so that 我可以高效地管理大量配置数据。

#### Acceptance Criteria

1. WHEN 下载导入模板时 THEN 模板 SHALL 包含包装类型列
2. WHEN 导入 Excel 数据时 THEN 系统 SHALL 验证包装类型值是否为四种预定义类型之一
3. WHEN 导入数据包含无效包装类型时 THEN 系统 SHALL 报告错误并跳过该行
4. WHEN 导出配置数据时 THEN 导出文件 SHALL 包含包装类型列
5. WHEN 导入模板说明时 THEN 模板 SHALL 包含包装类型的有效值说明

### Requirement 7: 数据迁移

**User Story:** As a 开发者, I want to 将现有数据迁移到新的数据结构, so that 系统升级后现有数据保持完整可用。

#### Acceptance Criteria

1. WHEN 执行数据迁移时 THEN 系统 SHALL 为所有现有配置设置 packaging_type 为 standard_box
2. WHEN 迁移包装方式字段时 THEN 系统 SHALL 将 pc_per_bag 映射到 layer1_qty，bags_per_box 映射到 layer2_qty，boxes_per_carton 映射到 layer3_qty
3. WHEN 迁移完成后 THEN 系统 SHALL 验证所有配置的包装类型和包装方式数据完整性
4. WHEN 迁移过程中发生错误时 THEN 系统 SHALL 回滚所有更改并报告错误详情

### Requirement 8: API 接口适配

**User Story:** As a 开发者, I want to 更新 API 接口以支持包装类型, so that 前后端可以正确传递包装类型数据。

#### Acceptance Criteria

1. WHEN 创建包装配置时 THEN API SHALL 接受 packaging_type 参数
2. WHEN 查询包装配置时 THEN API 响应 SHALL 包含 packaging_type 字段
3. WHEN 按包装类型筛选时 THEN API SHALL 支持 packaging_type 查询参数
4. WHEN 返回配置列表时 THEN API SHALL 支持按 packaging_type 分组返回数据
5. WHEN 请求包含无效 packaging_type 时 THEN API SHALL 返回 400 错误和明确的错误信息

### Requirement 9: 包装类型配置管理

**User Story:** As a 管理员, I want to 通过配置文件管理包装类型定义, so that 未来可以方便地添加新的包装类型而无需修改代码。

#### Acceptance Criteria

1. WHEN 系统初始化时 THEN 系统 SHALL 从配置文件或数据库加载包装类型定义
2. WHEN 定义包装类型时 THEN 配置 SHALL 包含：类型标识、中文名称、层级数量、各层单位标签
3. WHEN 添加新包装类型时 THEN 管理员 SHALL 只需在配置中添加新类型定义，无需修改前端组件代码
4. WHEN 前端渲染表单时 THEN 系统 SHALL 根据配置动态生成对应数量的输入字段和标签
5. WHEN 显示包装方式时 THEN 系统 SHALL 根据配置中的单位标签动态拼接显示文本

### Requirement 10: 包装类型配置结构

**User Story:** As a 开发者, I want to 使用结构化的配置定义包装类型, so that 系统可以灵活支持不同层级数量的包装结构。

#### Acceptance Criteria

1. WHEN 定义包装类型配置时 THEN 配置结构 SHALL 包含以下字段：
   - key: 类型标识（如 standard_box）
   - name: 中文名称（如 标准彩盒）
   - layers: 层级数量（2 或 3）
   - labels: 各层单位标签数组（如 ["pc/袋", "袋/盒", "盒/箱"]）
2. WHEN 系统启动时 THEN 系统 SHALL 验证配置的完整性和有效性
3. WHEN 配置无效时 THEN 系统 SHALL 记录错误日志并使用默认配置
4. WHEN 查询可用包装类型时 THEN API SHALL 返回完整的类型配置列表供前端使用
