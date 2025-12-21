# Design Document: User Card UI

## Overview

将用户管理页面从传统表格布局改造为现代化卡片布局，同时保留列表视图切换功能。改造仅涉及前端 `UserManage.vue` 组件，后端 API 保持不变。

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UserManage.vue                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │              Header Section                      │    │
│  │  - Title                                         │    │
│  │  - Search Input                                  │    │
│  │  - View Toggle (Grid/List)                       │    │
│  │  - Add User Button                               │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Filter Section                      │    │
│  │  - Role Filter Dropdown                          │    │
│  │  - Status Filter Dropdown                        │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Content Section                     │    │
│  │  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │  UserCard   │  │  UserCard   │  (Card View)  │    │
│  │  └─────────────┘  └─────────────┘               │    │
│  │  ─────────────────────────────────              │    │
│  │  │ el-table (List View)         │               │    │
│  │  ─────────────────────────────────              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### UserManage.vue (改造)

主要改动：
1. 添加视图切换状态 `viewMode: 'card' | 'list'`
2. 添加搜索和筛选状态
3. 条件渲染卡片视图或列表视图
4. 使用 CSS Grid 实现响应式卡片布局

### UserCard 组件结构

```vue
<div class="user-card">
  <!-- 头部：头像 + 用户信息 -->
  <div class="card-header">
    <div class="avatar">{{ getInitial(user.real_name) }}</div>
    <div class="user-info">
      <div class="username">{{ user.username }}</div>
      <div class="real-name">{{ user.real_name }}</div>
      <el-tag :color="getRoleColor(user.role)">{{ getRoleName(user.role) }}</el-tag>
    </div>
  </div>
  
  <!-- 内容：邮箱 + 状态 -->
  <div class="card-body">
    <div class="email">📧 {{ user.email }}</div>
    <div class="status">
      <span :class="user.is_active ? 'dot-active' : 'dot-inactive'"></span>
      {{ user.is_active ? '已启用' : '已禁用' }}
    </div>
  </div>
  
  <!-- 操作栏 -->
  <div class="card-actions">
    <el-button :icon="Key" @click="resetPassword(user)" />
    <el-button :icon="EditPen" @click="editUser(user)" />
    <el-button :icon="Delete" @click="deleteUser(user)" :disabled="user.username === 'admin'" />
  </div>
</div>
```

### 接口定义

```typescript
// 视图模式
type ViewMode = 'card' | 'list'

// 筛选状态
interface FilterState {
  search: string
  role: string | ''
  status: 'all' | 'active' | 'inactive'
}

// 角色颜色映射
const ROLE_COLORS: Record<string, string> = {
  admin: '#F56C6C',
  purchaser: '#E6A23C',
  producer: '#67C23A',
  reviewer: '#409EFF',
  salesperson: '#9B59B6',
  readonly: '#909399'
}
```

## Data Models

无需修改，复用现有 User 数据模型：

```typescript
interface User {
  id: number
  username: string
  real_name: string
  role: 'admin' | 'purchaser' | 'producer' | 'reviewer' | 'salesperson' | 'readonly'
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role badge color mapping
*For any* user with a valid role, the displayed badge color SHALL match the predefined ROLE_COLORS mapping for that role.
**Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 2: Status indicator consistency
*For any* user, the status indicator SHALL display green dot when is_active is true, and gray dot when is_active is false.
**Validates: Requirements 1.6**

### Property 3: Search filter correctness
*For any* search term, all displayed users SHALL have username or real_name containing the search term (case-insensitive).
**Validates: Requirements 4.1**

### Property 4: Role filter correctness
*For any* selected role filter (non-empty), all displayed users SHALL have the selected role.
**Validates: Requirements 4.2**

### Property 5: Status filter correctness
*For any* selected status filter, all displayed users SHALL have is_active matching the filter (active=true, inactive=false).
**Validates: Requirements 4.3**

### Property 6: View switch state preservation
*For any* filter/search state, switching between card and list views SHALL preserve the filter/search state and display the same filtered user set.
**Validates: Requirements 2.4**

## Error Handling

| 场景 | 处理方式 |
|------|----------|
| 用户列表加载失败 | 显示错误提示，保留重试按钮 |
| 删除 admin 用户 | 禁用删除按钮，不允许操作 |
| 空搜索结果 | 显示"暂无匹配用户"提示 |
| 邮箱为空 | 显示占位符"-" |

## Testing Strategy

### Unit Tests
- 测试 `getRoleColor()` 函数返回正确颜色
- 测试 `getRoleName()` 函数返回正确中文名称
- 测试 `getInitial()` 函数返回正确首字母
- 测试 `filterUsers()` 函数筛选逻辑

### Property-Based Tests
使用 fast-check 库进行属性测试：

1. **角色颜色映射测试**: 生成随机有效角色，验证颜色映射正确
2. **状态指示器测试**: 生成随机布尔值，验证状态显示正确
3. **搜索筛选测试**: 生成随机用户列表和搜索词，验证筛选结果正确
4. **角色筛选测试**: 生成随机用户列表和角色，验证筛选结果正确
5. **状态筛选测试**: 生成随机用户列表和状态，验证筛选结果正确
6. **视图切换测试**: 生成随机筛选状态，验证切换视图后状态保持

### Integration Tests
- 测试卡片视图渲染
- 测试列表视图渲染
- 测试视图切换
- 测试用户操作（编辑、删除、重置密码）弹窗触发
