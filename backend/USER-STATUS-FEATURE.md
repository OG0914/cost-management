# 用户禁用/启用功能说明

## 功能概述

添加了用户禁用/启用功能，管理员可以禁用用户账号，被禁用的用户无法登录系统。

## 实现内容

### 1. 数据库变更 ✅

**添加字段**: `is_active` (BOOLEAN)
- 默认值: 1 (启用)
- 0 = 禁用
- 1 = 启用

**迁移脚本**: `backend/scripts/add-user-is-active.js`

运行方式:
```bash
cd backend
node scripts/add-user-is-active.js
```

### 2. 后端更新 ✅

#### 2.1 登录验证 (`authController.js`)

**功能**: 登录时检查用户状态

```javascript
// 检查用户是否被禁用
if (user.is_active === 0 || user.is_active === false) {
  return res.status(403).json(error('该账号已被禁用，请联系管理员', 403));
}
```

**响应**:
- 状态码: 403
- 消息: "该账号已被禁用，请联系管理员"

#### 2.2 用户编辑 (`authController.js`)

**功能**: 支持修改用户状态

**接口**: `PUT /api/auth/users/:id`

**请求体**:
```json
{
  "real_name": "张三",
  "email": "zhangsan@example.com",
  "role": "salesperson",
  "is_active": false  // 新增字段
}
```

**保护措施**:
- ✅ 不能禁用管理员账号（admin）
- ✅ 检查用户是否存在
- ✅ 验证角色合法性

#### 2.3 禁用/启用专用接口 (`authController.js`)

**功能**: 快速切换用户状态

**接口**: `PATCH /api/auth/users/:id/toggle-status`

**请求体**:
```json
{
  "is_active": false  // true=启用, false=禁用
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户禁用成功",
  "data": null
}
```

#### 2.4 用户模型更新 (`User.js`)

**findAll 方法**: 返回 `is_active` 字段

**update 方法**: 支持动态更新字段
- 只更新提供的字段
- 自动转换 boolean 为 0/1
- 更新时间戳

### 3. API 端点

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录（检查状态） | 公开 |
| GET | `/api/auth/users` | 获取用户列表（含状态） | 管理员 |
| PUT | `/api/auth/users/:id` | 更新用户（含状态） | 管理员 |
| PATCH | `/api/auth/users/:id/toggle-status` | 切换用户状态 | 管理员 |

## 使用场景

### 场景1：禁用用户

```bash
# 禁用用户
PATCH /api/auth/users/16/toggle-status
{
  "is_active": false
}

# 响应
{
  "success": true,
  "message": "用户禁用成功"
}
```

### 场景2：启用用户

```bash
# 启用用户
PATCH /api/auth/users/16/toggle-status
{
  "is_active": true
}

# 响应
{
  "success": true,
  "message": "用户启用成功"
}
```

### 场景3：被禁用用户尝试登录

```bash
# 登录请求
POST /api/auth/login
{
  "username": "salesperson",
  "password": "sales123"
}

# 响应（如果用户被禁用）
{
  "success": false,
  "message": "该账号已被禁用，请联系管理员",
  "code": 403
}
```

### 场景4：尝试禁用管理员

```bash
# 禁用管理员
PATCH /api/auth/users/1/toggle-status
{
  "is_active": false
}

# 响应
{
  "success": false,
  "message": "不能禁用管理员账号",
  "code": 400
}
```

## 前端集成建议

### 1. 用户列表显示

```vue
<el-table-column label="状态" width="100">
  <template #default="{ row }">
    <el-tag :type="row.is_active ? 'success' : 'danger'">
      {{ row.is_active ? '启用' : '禁用' }}
    </el-tag>
  </template>
</el-table-column>
```

### 2. 禁用/启用按钮

```vue
<el-table-column label="操作" width="200">
  <template #default="{ row }">
    <el-button 
      size="small" 
      :type="row.is_active ? 'warning' : 'success'"
      @click="toggleStatus(row)"
      v-if="row.username !== 'admin'"
    >
      {{ row.is_active ? '禁用' : '启用' }}
    </el-button>
  </template>
</el-table-column>
```

### 3. 切换状态方法

```javascript
const toggleStatus = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要${user.is_active ? '禁用' : '启用'}用户 ${user.username} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const res = await request.patch(`/auth/users/${user.id}/toggle-status`, {
      is_active: !user.is_active
    });

    if (res.success) {
      ElMessage.success(res.message);
      loadUsers(); // 刷新列表
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};
```

### 4. 编辑表单

```vue
<el-form-item label="状态">
  <el-switch
    v-model="form.is_active"
    active-text="启用"
    inactive-text="禁用"
    :disabled="form.username === 'admin'"
  />
</el-form-item>
```

## 数据库查询

### 查询所有启用的用户

```sql
SELECT * FROM users WHERE is_active = 1;
```

### 查询所有禁用的用户

```sql
SELECT * FROM users WHERE is_active = 0;
```

### 禁用用户

```sql
UPDATE users SET is_active = 0 WHERE id = ?;
```

### 启用用户

```sql
UPDATE users SET is_active = 1 WHERE id = ?;
```

## 安全考虑

### 1. 保护措施
- ✅ 不能禁用管理员账号
- ✅ 只有管理员可以禁用/启用用户
- ✅ 被禁用用户无法登录
- ✅ 使用事务确保数据一致性

### 2. 审计建议
建议后续添加：
- 记录禁用/启用操作日志
- 记录操作人和操作时间
- 记录禁用原因

### 3. 通知机制
建议后续添加：
- 禁用时发送邮件通知用户
- 启用时发送邮件通知用户

## 测试步骤

### 测试1：禁用用户

```bash
# 1. 使用 admin 登录
# 2. 禁用 salesperson 用户
PATCH /api/auth/users/16/toggle-status
{ "is_active": false }

# 3. 使用 salesperson 尝试登录
# 预期：登录失败，提示账号已被禁用
```

### 测试2：启用用户

```bash
# 1. 启用 salesperson 用户
PATCH /api/auth/users/16/toggle-status
{ "is_active": true }

# 2. 使用 salesperson 登录
# 预期：登录成功
```

### 测试3：保护管理员

```bash
# 1. 尝试禁用 admin 用户
PATCH /api/auth/users/1/toggle-status
{ "is_active": false }

# 预期：失败，提示不能禁用管理员账号
```

### 测试4：用户列表

```bash
# 1. 获取用户列表
GET /api/auth/users

# 预期：返回的用户数据包含 is_active 字段
```

## 相关文件

- `backend/scripts/add-user-is-active.js` - 数据库迁移脚本
- `backend/controllers/authController.js` - 认证控制器
- `backend/models/User.js` - 用户模型
- `backend/routes/authRoutes.js` - 认证路由

## 后续优化建议

1. **审计日志**
   - 记录禁用/启用操作
   - 记录操作人和时间
   - 记录禁用原因

2. **通知机制**
   - 邮件通知用户
   - 系统内消息通知

3. **批量操作**
   - 批量禁用用户
   - 批量启用用户

4. **定时任务**
   - 自动禁用长期未登录的用户
   - 定期清理禁用用户数据

5. **前端优化**
   - 添加禁用原因输入
   - 显示禁用时间和操作人
   - 添加禁用历史记录

## 版本信息

- **更新时间**: 2025-10-24
- **更新者**: Kiro AI Assistant
- **版本**: v1.2.0
- **状态**: ✅ 已完成

---

**注意**: 禁用用户不会删除用户数据，只是阻止登录。如需删除用户，请使用删除功能。
