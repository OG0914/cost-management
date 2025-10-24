# 用户删除功能修复说明

## 问题描述

在用户管理模块中，删除某个用户时失败，提示错误。

## 问题原因

数据库中存在外键约束：
- `quotations` 表的 `created_by` 字段引用 `users.id`
- `quotations` 表的 `reviewed_by` 字段引用 `users.id`

当用户创建过报价单或审核过报价单时，由于外键约束，无法直接删除该用户。

## 解决方案

### 1. 添加关联检查

在 `User` 模型中添加 `hasRelatedQuotations` 方法：

```javascript
static hasRelatedQuotations(userId) {
  const db = dbManager.getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM quotations 
    WHERE created_by = ? OR reviewed_by = ?
  `);
  const result = stmt.get(userId, userId);
  return result.count > 0;
}
```

### 2. 更新删除逻辑

在 `authController.js` 的 `deleteUser` 方法中：

```javascript
// 检查用户是否有关联的报价单
const hasQuotations = User.hasRelatedQuotations(id);
if (hasQuotations) {
  return res.status(400).json(error('该用户有关联的报价单，无法删除。请先删除或转移相关报价单。', 400));
}
```

### 3. 增强错误处理

- 检查用户是否存在
- 检查是否为管理员账号
- 检查是否有关联数据
- 返回清晰的错误提示

## 修复后的行为

### 场景1：删除没有关联数据的用户
✅ **成功** - 用户被删除

### 场景2：删除有报价单的用户
❌ **失败** - 提示："该用户有关联的报价单，无法删除。请先删除或转移相关报价单。"

### 场景3：删除管理员账号
❌ **失败** - 提示："不能删除管理员账号"

### 场景4：删除不存在的用户
❌ **失败** - 提示："用户不存在"

## 使用建议

### 方案A：删除关联数据（推荐用于测试环境）

如果要删除有报价单的用户，需要先删除该用户的所有报价单：

```sql
-- 查看用户的报价单
SELECT * FROM quotations WHERE created_by = ? OR reviewed_by = ?;

-- 删除用户的报价单
DELETE FROM quotations WHERE created_by = ?;
```

### 方案B：转移数据所有权（推荐用于生产环境）

将用户的报价单转移给其他用户：

```sql
-- 转移创建的报价单
UPDATE quotations SET created_by = ? WHERE created_by = ?;

-- 转移审核的报价单
UPDATE quotations SET reviewed_by = ? WHERE reviewed_by = ?;
```

### 方案C：软删除（最佳实践）

在生产环境中，建议实现软删除：

1. 添加 `is_deleted` 字段到 `users` 表
2. 删除时只标记为已删除，不真正删除记录
3. 查询时过滤已删除的用户

```sql
-- 添加字段
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0;

-- 软删除
UPDATE users SET is_deleted = 1 WHERE id = ?;

-- 查询时过滤
SELECT * FROM users WHERE is_deleted = 0;
```

## 测试步骤

### 1. 测试删除有报价单的用户

```bash
# 使用 salesperson 账号创建报价单
# 然后尝试删除 salesperson 用户
# 应该提示：该用户有关联的报价单，无法删除
```

### 2. 测试删除没有报价单的用户

```bash
# 创建一个新用户（没有创建任何报价单）
# 尝试删除该用户
# 应该成功删除
```

### 3. 测试删除管理员

```bash
# 尝试删除 admin 用户
# 应该提示：不能删除管理员账号
```

## 相关文件

- `backend/controllers/authController.js` - 用户控制器
- `backend/models/User.js` - 用户模型
- `backend/db/seedData.sql` - 数据库结构

## 后续优化建议

1. **实现软删除**
   - 添加 `is_deleted` 字段
   - 修改查询逻辑过滤已删除用户
   - 提供恢复功能

2. **数据转移功能**
   - 在删除用户前，提供转移数据的选项
   - 允许管理员选择新的数据所有者

3. **批量操作**
   - 支持批量删除用户
   - 提供批量数据转移功能

4. **审计日志**
   - 记录用户删除操作
   - 记录数据转移操作

---

**修复时间**: 2025-10-24  
**修复者**: Kiro AI Assistant  
**状态**: ✅ 已修复
