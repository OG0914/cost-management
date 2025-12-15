# Design Document: UI Redesign

## Overview

本设计文档描述成本分析管理系统前端 UI 改造的技术实现方案。改造目标是将现有基于 Element Plus 默认样式的界面，升级为现代化、简洁、专业的企业级管理系统界面。

核心改造内容：
1. 创建新的 Layout 布局组件，包含 Sidebar 和 Header
2. 重新设计 Dashboard 仪表盘页面
3. 引入 Tailwind CSS 原子化样式和 Remix Icon 图标库
4. 实现菜单权限控制和路由集成

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.vue                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MainLayout.vue                         │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────────┐ │  │
│  │  │             │  │  AppHeader.vue                      │ │  │
│  │  │  AppSidebar │  ├─────────────────────────────────────┤ │  │
│  │  │    .vue     │  │                                     │ │  │
│  │  │             │  │  <router-view />                    │ │  │
│  │  │             │  │  (Dashboard / 其他页面)              │ │  │
│  │  │             │  │                                     │ │  │
│  │  └─────────────┘  └─────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| Vue 3 | 前端框架 | ^3.3.11 |
| Vue Router | 路由管理 | ^4.2.5 |
| Pinia | 状态管理 | ^2.1.7 |
| Tailwind CSS | 原子化样式 | ^3.4.1 |
| Remix Icon | 图标库 | ^3.5.0 |
| Element Plus | UI 组件库（保留用于表单等） | ^2.5.1 |

## Components and Interfaces

### 1. MainLayout.vue

主布局组件，包裹所有需要侧边栏的页面。

```typescript
interface MainLayoutProps {
  // 无 props，通过 slot 渲染子页面
}

interface MainLayoutState {
  isSidebarCollapsed: boolean  // 预留：侧边栏折叠状态
}
```

### 2. AppSidebar.vue

侧边导航栏组件。

```typescript
interface MenuItem {
  id: string           // 菜单唯一标识
  label: string        // 显示文本
  icon: string         // Remix Icon 类名
  route?: string       // 路由路径（无子菜单时）
  children?: MenuItem[] // 子菜单项
  roles?: string[]     // 允许访问的角色列表
}

interface AppSidebarState {
  activeMenuId: string      // 当前选中的菜单 ID
  expandedMenuIds: string[] // 已展开的父菜单 ID 列表
}

interface AppSidebarMethods {
  toggleSubmenu(menuId: string): void  // 展开/收起子菜单
  navigateTo(menuItem: MenuItem): void // 导航到指定菜单
  isMenuVisible(menuItem: MenuItem): boolean // 检查菜单是否可见
}
```

### 3. AppHeader.vue

顶部栏组件。

```typescript
interface AppHeaderProps {
  // 无 props
}

interface AppHeaderEmits {
  'toggle-sidebar': () => void  // 预留：触发侧边栏折叠
}
```

### 4. Dashboard.vue (重构)

仪表盘页面组件。

```typescript
interface DashboardState {
  stats: DashboardStats             // 统计数据
  topModels: TopModelItem[]         // 型号排行（显示在本月报价单后面）
  regulations: RegulationOverview[] // 法规总览（CE/NIOSH/GB等）
  systemStatus: SystemStatus        // 系统状态
}

interface DashboardStats {
  monthlyQuotations: number   // 本月报价单数
  activeMaterials: number     // 有效原料 SKU 数
  growthRate?: number         // 增长率
}

interface TopModelItem {
  rank: number
  modelName: string
  count: number
}

interface RegulationOverview {
  name: string    // 法规名称 (CE/NIOSH/GB/ASNZS等)
  count: number   // 该法规下的型号数量
}

interface SystemStatus {
  database: 'normal' | 'error'
  lastBackup: string
  version: string
}
```

### 5. StatCard.vue

统计卡片组件。

```typescript
interface StatCardProps {
  icon: string          // Remix Icon 类名
  iconBgColor: string   // 图标背景色 Tailwind 类
  iconColor: string     // 图标颜色 Tailwind 类
  title: string         // 卡片标题
  value: string | number // 显示数值
  badge?: {             // 可选的标签
    text: string
    type: 'success' | 'warning' | 'info'
  }
}
```

### 6. QuickNavButton.vue

快捷导航按钮组件。

```typescript
interface QuickNavButtonProps {
  icon: string          // Remix Icon 类名
  iconBgColor: string   // 图标背景色
  iconColor: string     // 图标颜色
  label: string         // 按钮文字
  isDashed?: boolean    // 是否为虚线边框（自定义按钮）
}

interface QuickNavButtonEmits {
  'click': () => void
}
```

## Data Models

### 菜单配置数据

```javascript
const menuConfig = [
  { 
    id: 'dashboard', 
    label: '仪表盘', 
    icon: 'ri-dashboard-3-line',
    route: '/dashboard'
  },
  { 
    id: 'cost', 
    label: '成本管理', 
    icon: 'ri-money-cny-box-line',
    roles: ['admin', 'reviewer', 'salesperson', 'readonly'],
    children: [
      { id: 'cost_add', label: '新增报价', route: '/cost/add' },
      { id: 'cost_standard', label: '标准成本', route: '/cost/standard' },
      { id: 'cost_records', label: '成本记录', route: '/cost/records' }
    ]
  },
  { 
    id: 'regulation', 
    label: '法规管理', 
    icon: 'ri-government-line',
    route: '/regulations',
    roles: ['admin']
  },
  { 
    id: 'model', 
    label: '型号管理', 
    icon: 'ri-price-tag-3-line',
    route: '/models',
    roles: ['admin']
  },
  { 
    id: 'material', 
    label: '原料管理', 
    icon: 'ri-stack-line',
    route: '/materials'
  },
  { 
    id: 'packaging', 
    label: '包材管理', 
    icon: 'ri-box-3-line',
    route: '/packaging'
  },
  { 
    id: 'process', 
    label: '工序管理', 
    icon: 'ri-settings-4-line',
    route: '/processes'
  },
  { 
    id: 'config', 
    label: '系统配置', 
    icon: 'ri-equalizer-line',
    route: '/config'
  },
  { 
    id: 'user', 
    label: '用户管理', 
    icon: 'ri-user-settings-line',
    route: '/users',
    roles: ['admin']
  }
]
```

### 问候语计算逻辑

```javascript
function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return '早上好'
  if (hour >= 11 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  return '您辛苦了'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于需求分析，以下是可测试的正确性属性：

### Property 1: 子菜单展开状态切换

*For any* 带有子菜单的菜单项，当用户点击该菜单项时，其展开状态应该切换（展开变收起，收起变展开）。

**Validates: Requirements 1.3**

### Property 2: 菜单项选中高亮

*For any* 菜单项（包括子菜单项），当用户点击该菜单项时，该菜单项应该被标记为当前选中状态。

**Validates: Requirements 1.4**

### Property 3: 问候语时间计算

*For any* 小时值（0-23），问候语函数应该返回正确的问候语：
- 6-10 点返回「早上好」
- 11-13 点返回「中午好」
- 14-17 点返回「下午好」
- 其他时间返回「您辛苦了」

**Validates: Requirements 2.1**

### Property 4: 统计卡片数据渲染

*For any* 有效的统计卡片数据对象，渲染后的卡片应该包含图标、标题和数值三个必要元素。

**Validates: Requirements 2.3**

### Property 5: 路由与页面组件对应

*For any* 有效的路由路径，Layout 组件应该在主内容区域渲染对应的页面组件。

**Validates: Requirements 5.1**

### Property 6: 角色权限菜单过滤

*For any* 用户角色，菜单列表应该只显示该角色有权限访问的菜单项。具体规则：
- 非管理员角色不显示「用户管理」「法规管理」「型号管理」
- 采购/生产人员不显示「成本管理」相关菜单

**Validates: Requirements 6.2**

## Error Handling

### 1. 用户信息加载失败

当无法获取用户信息时：
- 侧边栏底部显示「未知用户」
- 角色显示为「-」
- 记录错误日志

### 2. 统计数据加载失败

当 Dashboard 统计数据 API 调用失败时：
- 显示加载失败提示
- 数值显示为「-」
- 提供重试按钮

### 3. 路由权限拦截

当用户尝试访问无权限的路由时：
- 重定向到 Dashboard
- 显示权限不足提示

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试：

1. **问候语函数测试** - 测试不同时间段返回正确问候语
2. **菜单权限过滤测试** - 测试不同角色的菜单过滤逻辑
3. **子菜单状态切换测试** - 测试展开/收起逻辑

### 属性测试

使用 fast-check 进行属性测试：

1. **Property 1**: 子菜单展开状态切换
   - 生成随机的带子菜单的菜单项
   - 验证点击后状态正确切换

2. **Property 2**: 菜单项选中高亮
   - 生成随机菜单项
   - 验证点击后正确设置选中状态

3. **Property 3**: 问候语时间计算
   - 生成 0-23 的随机小时值
   - 验证返回正确的问候语

4. **Property 4**: 统计卡片数据渲染
   - 生成随机的卡片数据对象
   - 验证渲染结果包含必要元素

5. **Property 5**: 路由与页面组件对应
   - 生成有效路由路径
   - 验证渲染正确的组件

6. **Property 6**: 角色权限菜单过滤
   - 生成随机用户角色
   - 验证菜单过滤结果符合权限规则

### 测试配置

```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js']
  }
}
```

属性测试最小运行次数：100 次迭代
