# 响应式布局优化设计

> 创建时间: 2026-01-13
> 状态: 已完成

## 需求概述

- 目标: 全面适配手机、平板、桌面端
- 断点: Tailwind 默认 (sm:640px, md:768px, lg:1024px, xl:1280px)
- 表格: 混合方案 (简单表格卡片化，复杂表格横向滚动)
- 导航: 移动端抽屉式侧边栏

## 实施清单

- [x] 设计文档
- [x] P0: MainLayout 抽屉式侧边栏 (移动端顶栏 + el-drawer)
- [x] P0: 公共组件 (MobileDataCard, ResponsiveTable)
- [x] P1: Dashboard 响应式 (问候卡片、统计卡片、快捷导航)
- [x] P1: CostAdd 移动端优化 (表单单列布局、底部操作栏)
- [x] P1: 列表页卡片视图 (CostRecords, PendingReview, ApprovedReview)
- [x] P2: 管理页表格响应式 (通用样式: 搜索栏堆叠、弹窗全屏)
- [x] P3: 其他页面响应式 (通用样式继承)
