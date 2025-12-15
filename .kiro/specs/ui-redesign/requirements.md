# Requirements Document

## Introduction

本需求文档描述成本分析管理系统前端 UI 改造项目。目标是将现有基于 Element Plus 默认样式的界面，改造为参考设计稿中展示的现代化、简洁、专业的企业级管理系统界面风格。

改造重点包括：
- 全新的侧边导航栏布局（固定宽度、折叠子菜单、用户信息底部展示）
- 现代化的仪表盘设计（问候语、统计卡片、快捷导航、系统状态）
- 统一的视觉设计语言（Inter 字体、Slate 色系、圆角卡片、微妙阴影）
- 保持与现有后端 API 和业务逻辑的完全兼容

## Glossary

- **Sidebar**：侧边导航栏，固定在页面左侧，包含菜单项和用户信息
- **Dashboard**：仪表盘，系统首页，展示核心指标和快捷入口
- **Layout**：布局组件，包含 Sidebar 和主内容区域的整体框架
- **Menu Item**：菜单项，可以是单级菜单或带子菜单的折叠菜单
- **Stat Card**：统计卡片，展示单个核心指标的卡片组件
- **Quick Nav**：快捷导航，提供常用功能的快速入口按钮
- **Tailwind CSS**：原子化 CSS 框架，用于快速构建自定义界面
- **Remix Icon**：图标库，提供丰富的线性图标

## Requirements

### Requirement 1

**User Story:** As a 系统用户, I want 看到现代化的侧边导航栏, so that 我可以快速定位和访问各个功能模块。

#### Acceptance Criteria

1. WHEN 用户登录系统后 THEN the Layout 组件 SHALL 在页面左侧显示固定宽度（256px）的侧边导航栏
2. WHEN 侧边导航栏渲染时 THEN the Sidebar SHALL 在顶部显示系统 Logo 和名称「成本分析系统」
3. WHEN 用户点击带有子菜单的菜单项 THEN the Sidebar SHALL 展开或收起该菜单项的子菜单列表，并显示箭头旋转动画
4. WHEN 用户点击菜单项 THEN the Sidebar SHALL 高亮当前选中的菜单项（蓝色背景 + 蓝色文字）
5. WHEN 侧边导航栏渲染时 THEN the Sidebar SHALL 在底部显示当前登录用户的姓名、角色信息和退出按钮（不显示头像）

### Requirement 2

**User Story:** As a 系统用户, I want 看到信息丰富的仪表盘首页, so that 我可以快速了解系统状态和常用操作入口。

#### Acceptance Criteria

1. WHEN 用户访问仪表盘页面 THEN the Dashboard SHALL 显示基于当前时间的问候语（早上好/中午好/下午好/您辛苦了）和用户姓名
2. WHEN 仪表盘渲染时 THEN the Dashboard SHALL 显示四个统计卡片：本月报价单数量、本月型号TOP3、法规总览（CE/NIOSH/GB/ASNZS等）、有效原料SKU数
3. WHEN 用户查看统计卡片 THEN the Stat Card SHALL 显示图标、标题、数值，部分卡片显示增长百分比标签
4. WHEN 仪表盘渲染时 THEN the Dashboard SHALL 显示快捷导航区域，包含「新增报价」「标准成本」等常用功能按钮
5. WHEN 仪表盘渲染时 THEN the Dashboard SHALL 显示系统概况区域，包含数据库状态、最近备份时间、系统版本信息

### Requirement 3

**User Story:** As a 系统用户, I want 整个系统使用统一的视觉设计语言, so that 界面看起来专业、一致、易于使用。

#### Acceptance Criteria

1. WHEN 任何页面渲染时 THEN the System SHALL 使用 Inter 字体作为主要字体，Slate 色系作为主要配色
2. WHEN 卡片组件渲染时 THEN the Card SHALL 使用圆角（12px-16px）、微妙阴影（shadow-sm）、细边框（border-slate-100）
3. WHEN 按钮组件渲染时 THEN the Button SHALL 使用圆角设计，主要按钮使用 primary-600 蓝色
4. WHEN 页面内容区域渲染时 THEN the Content Area SHALL 使用浅灰色背景（#F8FAFC）与白色卡片形成层次对比
5. WHEN 滚动条出现时 THEN the Scrollbar SHALL 使用自定义样式（6px宽度、圆角、slate色系）

### Requirement 4

**User Story:** As a 系统用户, I want 顶部有一个功能栏, so that 我可以快速访问通知和设置功能。

#### Acceptance Criteria

1. WHEN 主内容区域渲染时 THEN the Header SHALL 在顶部显示固定高度（64px）的白色顶部栏
2. WHEN 顶部栏渲染时 THEN the Header SHALL 在右侧显示通知图标（带红点提示）和设置图标
3. WHEN 用户悬停在图标上 THEN the Icon SHALL 显示颜色变化的悬停效果

### Requirement 5

**User Story:** As a 开发者, I want 布局组件支持路由集成, so that 不同页面可以在主内容区域正确渲染。

#### Acceptance Criteria

1. WHEN 用户导航到不同路由 THEN the Layout SHALL 在主内容区域渲染对应的页面组件
2. WHEN 页面组件渲染时 THEN the Content Area SHALL 提供适当的内边距（32px）和最大宽度限制
3. WHEN 内容超出可视区域 THEN the Content Area SHALL 显示垂直滚动条，侧边栏保持固定

### Requirement 6

**User Story:** As a 系统用户, I want 菜单结构与现有功能模块对应, so that 我可以访问所有已实现的功能。

#### Acceptance Criteria

1. WHEN 侧边导航栏渲染时 THEN the Menu SHALL 包含以下菜单项：仪表盘、成本管理（子菜单：新增报价、标准成本、成本记录）、法规管理、型号管理、原料管理、包材管理、工序管理、系统配置、用户管理
2. WHEN 用户角色为非管理员 THEN the Menu SHALL 根据权限隐藏或禁用相应菜单项（如用户管理、法规管理、型号管理）
3. WHEN 用户角色为采购或生产人员 THEN the Menu SHALL 隐藏成本管理相关菜单项

### Requirement 7

**User Story:** As a 系统用户, I want 页面切换时有平滑的过渡效果, so that 界面交互感觉流畅自然。

#### Acceptance Criteria

1. WHEN 页面内容切换时 THEN the Content SHALL 显示淡入动画效果（fadeIn 0.4s）
2. WHEN 子菜单展开或收起时 THEN the Submenu SHALL 显示高度和透明度的过渡动画（0.3s ease-in-out）
