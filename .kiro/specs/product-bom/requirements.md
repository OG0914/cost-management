# Requirements Document

## Introduction

本功能为成本分析管理系统新增「产品BOM（物料清单）」模块，实现型号与原料的标准化绑定。通过建立型号级别的BOM，在新增报价时自动带出该型号的标准原料清单和用量，减少业务员重复选择原料的工作量，并确保原料单价与「原料管理」模块实时同步。

## Glossary

- **BOM (Bill of Materials)**：物料清单，定义一个产品所需的原料及其用量
- **型号 (Model)**：产品型号，如 N95口罩、KN95口罩等
- **原料 (Material)**：生产产品所需的物料，在「原料管理」模块统一维护
- **用量 (Usage Amount)**：生产单位产品所需的原料数量
- **包装配置 (Packaging Config)**：型号下的包装方式配置，如标准盒装、袋装等

## Requirements

### Requirement 1

**User Story:** As a 管理员, I want to 为每个型号配置标准原料BOM, so that 业务员新增报价时可以自动带出原料清单。

#### Acceptance Criteria

1. WHEN 管理员进入型号管理页面 THEN THE System SHALL 显示每个型号的BOM配置入口
2. WHEN 管理员点击配置BOM THEN THE System SHALL 显示该型号当前的原料清单（如有）
3. WHEN 管理员添加原料到BOM THEN THE System SHALL 提供原料下拉选择器，数据来源于原料管理模块
4. WHEN 管理员选择原料后 THEN THE System SHALL 自动显示该原料的名称、料号、单位和当前单价
5. WHEN 管理员输入用量并保存 THEN THE System SHALL 将原料ID和用量存储到BOM表中

### Requirement 2

**User Story:** As a 管理员, I want to 编辑和删除BOM中的原料项, so that 可以维护准确的原料清单。

#### Acceptance Criteria

1. WHEN 管理员修改BOM中某原料的用量 THEN THE System SHALL 更新该记录的用量值
2. WHEN 管理员删除BOM中某原料 THEN THE System SHALL 从BOM中移除该原料记录
3. WHEN 管理员调整原料排序 THEN THE System SHALL 按新顺序保存并显示原料列表
4. WHEN BOM发生变更 THEN THE System SHALL 记录更新时间

### Requirement 3

**User Story:** As a 业务员, I want to 新增报价时自动带出型号的BOM原料, so that 不需要每次手动选择原料。

#### Acceptance Criteria

1. WHEN 业务员选择型号配置 THEN THE System SHALL 自动加载该型号的BOM原料清单
2. WHEN 系统加载BOM原料 THEN THE System SHALL 从原料管理模块实时获取每个原料的当前单价
3. WHEN BOM原料加载完成 THEN THE System SHALL 在原料明细区域显示原料名称、用量和单价
4. WHEN 原料管理中的单价发生变化 THEN THE System SHALL 在下次加载BOM时使用最新单价

### Requirement 4

**User Story:** As a 业务员, I want to 在报价单中调整BOM带出的原料, so that 可以处理特殊情况。

#### Acceptance Criteria

1. WHEN BOM原料被加载到报价单 THEN THE System SHALL 允许业务员修改用量
2. WHEN BOM原料被加载到报价单 THEN THE System SHALL 允许业务员删除不需要的原料
3. WHEN BOM原料被加载到报价单 THEN THE System SHALL 允许业务员添加BOM之外的原料
4. WHEN 业务员修改BOM原料 THEN THE System SHALL 标记该原料为已修改状态

### Requirement 5

**User Story:** As a 系统, I want to 确保BOM数据的完整性和一致性, so that 避免数据错误。

#### Acceptance Criteria

1. WHEN 添加原料到BOM THEN THE System SHALL 验证原料ID在原料表中存在
2. WHEN 添加原料到BOM THEN THE System SHALL 验证用量为正数
3. WHEN 同一型号添加重复原料 THEN THE System SHALL 拒绝添加并提示原料已存在
4. WHEN 原料管理中删除某原料 THEN THE System SHALL 检查该原料是否被BOM引用并给出警告
5. WHEN 型号被删除 THEN THE System SHALL 级联删除该型号的BOM记录

