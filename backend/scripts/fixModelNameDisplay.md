# 修复型号名称显示问题

## 问题描述
在原料管理、工序管理和包材管理页面，当用户通过筛选栏选择型号后：
- ✅ 数据能正确筛选和显示
- ❌ 表格中的"型号"列显示为空白

## 根本原因
按型号筛选时使用的查询方法缺少 JOIN 语句，没有关联 `models` 表获取型号名称。

### 问题代码示例

**原料模型 (Material.js)**
```javascript
// ❌ 问题代码
static findByModelId(modelId) {
  const stmt = db.prepare(`
    SELECT * FROM materials
    WHERE model_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(modelId);
}
```

**包装配置模型 (PackagingConfig.js)**
```javascript
// ❌ 问题代码
static findByModelId(modelId) {
  const stmt = db.prepare(`
    SELECT * FROM packaging_configs
    WHERE model_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `);
  return stmt.all(modelId);
}
```

## 修复方案
在 `findByModelId` 方法中添加 LEFT JOIN 语句，关联 `models` 表获取 `model_name` 字段。

### 修复后的代码

**原料模型 (Material.js)**
```javascript
// ✅ 修复后
static findByModelId(modelId) {
  const db = dbManager.getDatabase();
  const stmt = db.prepare(`
    SELECT m.*, mo.model_name
    FROM materials m
    LEFT JOIN models mo ON m.model_id = mo.id
    WHERE m.model_id = ?
    ORDER BY m.created_at DESC
  `);
  return stmt.all(modelId);
}
```

**包装配置模型 (PackagingConfig.js)**
```javascript
// ✅ 修复后
static findByModelId(modelId) {
  const db = dbManager.getDatabase();
  const stmt = db.prepare(`
    SELECT pc.*, m.model_name
    FROM packaging_configs pc
    LEFT JOIN models m ON pc.model_id = m.id
    WHERE pc.model_id = ? AND pc.is_active = 1
    ORDER BY pc.created_at DESC
  `);
  return stmt.all(modelId);
}
```

## 影响范围

### 修复的模型
1. ✅ `backend/models/Material.js` - 原料模型
2. ✅ `backend/models/PackagingConfig.js` - 包装配置模型

### 影响的页面
1. ✅ 原料管理页面 (`MaterialManage.vue`)
2. ✅ 工序管理页面 (`ProcessManagement.vue`)
3. ✅ 包材管理页面 (`PackagingManage.vue`)

## 测试验证

### 测试步骤
1. 登录系统
2. 进入原料管理页面
3. 在筛选栏选择一个型号
4. 检查表格中的"型号"列是否正确显示型号名称
5. 重复步骤2-4，测试工序管理和包材管理页面

### 预期结果
- ✅ 选择型号后，表格中的"型号"列正确显示型号名称
- ✅ 数据正确筛选
- ✅ 其他功能不受影响

### 自动化测试
运行测试脚本验证修复：
```bash
node backend/scripts/testModelNameFix.js
```

## 技术细节

### SQL 查询对比

**修复前：**
```sql
SELECT * FROM materials WHERE model_id = ?
-- 结果：只有 materials 表的字段，没有 model_name
```

**修复后：**
```sql
SELECT m.*, mo.model_name
FROM materials m
LEFT JOIN models mo ON m.model_id = mo.id
WHERE m.model_id = ?
-- 结果：包含 materials 表的所有字段 + model_name 字段
```

### 为什么使用 LEFT JOIN？
- 允许 `model_id` 为 NULL 的记录也能查询出来
- 如果型号被删除，原料记录仍然可以显示（model_name 为 NULL）
- 保持数据完整性和查询的健壮性

## 相关方法对比

### findAll() 方法（正常）
```javascript
// 这个方法一直都有 JOIN，所以没有问题
static findAll() {
  const stmt = db.prepare(`
    SELECT m.*, mo.model_name
    FROM materials m
    LEFT JOIN models mo ON m.model_id = mo.id
    ORDER BY m.created_at DESC
  `);
  return stmt.all();
}
```

### findByModelId() 方法（已修复）
```javascript
// 现在与 findAll() 保持一致的查询结构
static findByModelId(modelId) {
  const stmt = db.prepare(`
    SELECT m.*, mo.model_name
    FROM materials m
    LEFT JOIN models mo ON m.model_id = mo.id
    WHERE m.model_id = ?
    ORDER BY m.created_at DESC
  `);
  return stmt.all(modelId);
}
```

## 总结
通过在 `findByModelId` 方法中添加 JOIN 语句，确保按型号筛选时也能获取到型号名称，解决了表格中型号列显示空白的问题。
