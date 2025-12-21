# Requirements Document

## Introduction

为包材管理和工序管理模块添加卡片/列表视图切换功能，提升用户体验和数据可视化效果。该功能参考现有用户管理模块的卡片视图实现，但根据包材和工序数据的特点进行定制化设计。

## Glossary

- **Card View (卡片视图)**: 以卡片形式展示数据的视图模式，每条记录显示为一个独立的卡片
- **List View (列表视图)**: 以表格形式展示数据的视图模式，即现有的 el-table 展示方式
- **View Toggle (视图切换)**: 允许用户在卡片视图和列表视图之间切换的按钮组
- **Packaging Config (包装配置)**: 包材管理中的数据记录，包含型号、配置名称、包装方式等信息
- **Process Config (工序配置)**: 工序管理中的数据记录，包含型号、配置名称、工序列表等信息
- **Model Category (产品类别)**: 产品的分类，如半面罩、全面罩等

## Requirements

### Requirement 1

**User Story:** As a 管理员或操作人员, I want to 在包材管理页面切换卡片和列表视图, so that 我可以根据需要选择最适合的数据展示方式。

#### Acceptance Criteria

1. WHEN 用户访问包材管理页面 THEN THE 系统 SHALL 默认显示卡片视图
2. WHEN 用户点击列表视图按钮 THEN THE 系统 SHALL 切换到表格展示模式并保留所有现有功能
3. WHEN 用户点击卡片视图按钮 THEN THE 系统 SHALL 切换到卡片展示模式
4. WHEN 视图切换按钮显示时 THEN THE 系统 SHALL 将按钮放置在筛选栏同一行的最右边

### Requirement 2

**User Story:** As a 管理员或操作人员, I want to 在工序管理页面切换卡片和列表视图, so that 我可以根据需要选择最适合的数据展示方式。

#### Acceptance Criteria

1. WHEN 用户访问工序管理页面 THEN THE 系统 SHALL 默认显示卡片视图
2. WHEN 用户点击列表视图按钮 THEN THE 系统 SHALL 切换到表格展示模式并保留所有现有功能
3. WHEN 用户点击卡片视图按钮 THEN THE 系统 SHALL 切换到卡片展示模式
4. WHEN 视图切换按钮显示时 THEN THE 系统 SHALL 将按钮放置在筛选栏同一行的最右边

### Requirement 3

**User Story:** As a 用户, I want to 在卡片视图中清晰地看到每条记录的关键信息, so that 我可以快速了解包装配置或工序配置的详情。

#### Acceptance Criteria

1. WHEN 卡片显示时 THEN THE 系统 SHALL 在卡片头部左侧垂直显示产品型号（model_name）和配置名称（config_name）
2. WHEN 卡片显示时 THEN THE 系统 SHALL 在卡片头部右侧显示一个圆形标识，圆形大小与产品型号和配置名称两行高度一致，内部显示产品类别（model_category）
3. WHEN 卡片显示时 THEN THE 系统 SHALL 显示包装类型标签、包装方式、每箱数量
4. WHEN 卡片显示时 THEN THE 系统 SHALL 显示价格信息（包材总价或工序总价）和启用状态
5. WHEN 卡片显示时 THEN THE 系统 SHALL 在卡片底部显示操作按钮（查看、编辑、复制、删除）

### Requirement 4

**User Story:** As a 用户, I want to 在卡片视图下仍能使用筛选和分页功能, so that 我可以方便地查找和浏览数据。

#### Acceptance Criteria

1. WHEN 用户在卡片视图下使用型号筛选 THEN THE 系统 SHALL 根据筛选条件过滤显示的卡片
2. WHEN 用户在卡片视图下使用包装类型筛选 THEN THE 系统 SHALL 根据筛选条件过滤显示的卡片
3. WHEN 卡片数量超过每页限制时 THEN THE 系统 SHALL 显示分页控件并支持翻页

### Requirement 5

**User Story:** As a 用户, I want to 卡片视图下的批量操作仅在列表模式可用, so that 卡片视图保持简洁。

#### Acceptance Criteria

1. WHEN 用户处于卡片视图模式 THEN THE 系统 SHALL 隐藏卡片上的选择框
2. WHEN 用户处于列表视图模式 THEN THE 系统 SHALL 显示表格的选择列并支持批量操作
3. WHEN 用户切换到卡片视图 THEN THE 系统 SHALL 清空已选择的记录

### Requirement 6

**User Story:** As a 用户, I want to 卡片视图具有响应式布局, so that 在不同屏幕尺寸下都能正常显示。

#### Acceptance Criteria

1. WHEN 屏幕宽度大于1200px THEN THE 系统 SHALL 每行显示4张卡片
2. WHEN 屏幕宽度在992px到1199px之间 THEN THE 系统 SHALL 每行显示3张卡片
3. WHEN 屏幕宽度在768px到991px之间 THEN THE 系统 SHALL 每行显示2张卡片
4. WHEN 屏幕宽度小于768px THEN THE 系统 SHALL 每行显示1张卡片
