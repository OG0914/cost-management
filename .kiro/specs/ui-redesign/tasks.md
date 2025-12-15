# Implementation Plan

## UI Redesign - 前端界面改造

- [x] 1. 项目配置与依赖安装



  - [x] 1.1 安装 Remix Icon 图标库


    - 在 index.html 中添加 Remix Icon CDN 链接
    - _Requirements: 3.1_

  - [x] 1.2 配置 Tailwind CSS 扩展主题

    - 在 tailwind.config.js 中添加 primary 蓝色系和 slate 灰色系配色
    - 添加 Inter 字体配置
    - _Requirements: 3.1, 3.2, 3.3_


  - [x] 1.3 更新全局样式





    - 在 index.css 中添加自定义滚动条样式
    - 添加页面过渡动画 CSS


    - _Requirements: 3.5, 7.1, 7.2_

- [x] 2. 创建布局组件
  - [x] 2.1 创建 MainLayout.vue 主布局组件
    - 实现 flex 布局：左侧 Sidebar (256px) + 右侧主内容区
    - 集成 router-view 渲染子页面
    - _Requirements: 1.1, 5.1, 5.2, 5.3_
  - [x] 2.2 创建 AppHeader.vue 顶部栏组件
    - 实现固定高度 64px 的白色顶部栏
    - 添加通知图标（带红点）和设置图标
    - 实现图标悬停效果
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.3 创建 AppSidebar.vue 侧边导航栏组件
    - 实现 Logo 和系统名称显示
    - 实现菜单列表渲染（支持单级和多级菜单）
    - 实现子菜单展开/收起功能和箭头旋转动画
    - 实现菜单项选中高亮样式
    - 实现底部用户信息显示（姓名、角色、退出按钮）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 2.4 编写 AppSidebar 属性测试
    - **Property 1: 子菜单展开状态切换**
    - **Property 2: 菜单项选中高亮**
    - **Validates: Requirements 1.3, 1.4**

- [x] 3. 实现菜单权限控制



  - [x] 3.1 创建菜单配置数据


    - 在 config 目录创建 menuConfig.js
    - 定义完整菜单结构，包含 id、label、icon、route、roles、children
    - _Requirements: 6.1_


  - [x] 3.2 实现菜单权限过滤逻辑
    - 根据用户角色过滤菜单项
    - 非管理员隐藏用户管理、法规管理、型号管理
    - 采购/生产人员隐藏成本管理相关菜单
    - _Requirements: 6.2, 6.3_
  - [ ]* 3.3 编写菜单权限过滤属性测试
    - **Property 6: 角色权限菜单过滤**
    - **Validates: Requirements 6.2**

- [x] 4. 创建仪表盘组件



  - [x] 4.1 创建 StatCard.vue 统计卡片组件


    - 实现图标、标题、数值显示
    - 支持可选的增长率标签
    - 实现悬停阴影效果
    - _Requirements: 2.3_
  - [ ]* 4.2 编写 StatCard 属性测试
    - **Property 4: 统计卡片数据渲染**
    - **Validates: Requirements 2.3**


  - [x] 4.3 创建 QuickNavButton.vue 快捷导航按钮组件
    - 实现圆形图标 + 文字布局
    - 支持虚线边框样式（自定义按钮）
    - 实现悬停效果
    - _Requirements: 2.4_
  - [x] 4.4 创建问候语计算工具函数
    - 在 utils 目录创建 greeting.js
    - 实现基于时间的问候语计算逻辑
    - _Requirements: 2.1_
  - [ ]* 4.5 编写问候语属性测试
    - **Property 3: 问候语时间计算**
    - **Validates: Requirements 2.1**

- [x] 5. 重构 Dashboard.vue 仪表盘页面



  - [x] 5.1 实现问候语区域


    - 显示基于时间的问候语和用户姓名
    - 使用白色圆角卡片样式
    - _Requirements: 2.1_

  - [x] 5.2 实现统计卡片区域
    - 显示四个统计卡片：本月报价单、本月型号TOP3、法规总览、有效原料SKU
    - 使用 grid 布局，响应式排列
    - _Requirements: 2.2_
  - [x] 5.3 实现快捷导航区域
    - 显示「新增报价」「标准成本」「自定义」按钮
    - 点击跳转到对应页面
    - _Requirements: 2.4_
  - [x] 5.4 实现系统概况区域
    - 显示数据库状态、最近备份时间、系统版本
    - _Requirements: 2.5_
  - [x] 5.5 添加仪表盘数据获取逻辑
    - 调用后端 API 获取统计数据
    - 处理加载状态和错误状态
    - _Requirements: 2.2, 2.3_



- [x] 6. 路由集成与页面适配
  - [x] 6.1 更新路由配置
    - 将需要侧边栏的页面包裹在 MainLayout 中
    - 保持 Login 页面独立（不使用 MainLayout）
    - _Requirements: 5.1_
  - [ ]* 6.2 编写路由集成属性测试
    - **Property 5: 路由与页面组件对应**
    - **Validates: Requirements 5.1**
  - [x] 6.3 适配现有页面样式

    - 确保现有页面在新布局中正常显示
    - 调整页面内边距和最大宽度
    - _Requirements: 5.2_

- [x] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. 后端 API 扩展（仪表盘数据）



  - [x] 8.1 创建仪表盘统计 API

    - 添加 GET /api/dashboard/stats 接口
    - 返回本月报价单数量、有效原料数量
    - _Requirements: 2.2_

  - [ ] 8.2 创建法规总览 API
    - 添加 GET /api/dashboard/regulations 接口
    - 返回各法规类别及其型号数量

    - _Requirements: 2.2_
  - [ ] 8.3 创建型号排行 API
    - 添加 GET /api/dashboard/top-models 接口


    - 返回本月报价次数最多的前3个型号
    - _Requirements: 2.2_

- [ ] 9. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
