# 修复 SQLite 布尔值绑定错误 - 2025年11月3日

## 错误信息

```
TypeError: SQLite3 can only bind numbers, strings, bigints, buffers, and null
    at Quotation.update (E:\desktop\cost-management\backend\models\Quotation.js:208:25)
    at updateQuotation (E:\desktop\cost-management\backend\controllers\costController.js:292:19)
```

## 问题原因

SQLite 不支持布尔类型，只能使用整数（0 或 1）来表示布尔值。

在更新报价单时，代码传递了 JavaScript 布尔值 `true` 或 `false`：

```javascript
Quotation.update(id, {
    ...
    include_freight_in_base: req.body.include_freight_in_base !== false  // 返回 true 或 false
});
```

SQLite 无法绑定布尔值，导致错误。

## 修复方案

### 方案：在控制器中转换布尔值为整数

**修复位置：** `backend/controllers/costController.js` - `updateQuotation` 函数

**修复前：**
```javascript
Quotation.update(id, {
    customer_name,
    customer_region,
    quantity,
    freight_total,
    freight_per_unit,
    sales_type,
    base_cost: calculation.baseCost,
    overhead_price: calculation.overheadPrice,
    final_price,
    currency: calculation.currency,
    packaging_config_id: req.body.packaging_config_id || null,
    include_freight_in_base: req.body.include_freight_in_base !== false  // ❌ 布尔值
});
```

**修复后：**
```javascript
Quotation.update(id, {
    customer_name,
    customer_region,
    quantity,
    freight_total,
    freight_per_unit,
    sales_type,
    base_cost: calculation.baseCost,
    overhead_price: calculation.overheadPrice,
    final_price,
    currency: calculation.currency,
    packaging_config_id: req.body.packaging_config_id || null,
    include_freight_in_base: req.body.include_freight_in_base !== false ? 1 : 0  // ✅ 整数
});
```

## SQLite 布尔值处理规则

### 存储规则

SQLite 中的布尔值应该存储为整数：
- `0` 表示 `false`
- `1` 表示 `true`

### 读取规则

从数据库读取时，整数会自动转换为布尔值：
- `0` → `false`
- `1` → `true`
- 任何非零值 → `true`

### 写入规则

写入数据库时，必须将布尔值转换为整数：

```javascript
// ❌ 错误：直接使用布尔值
const value = true;
stmt.run(value);  // TypeError

// ✅ 正确：转换为整数
const value = true ? 1 : 0;
stmt.run(value);  // 成功
```

## 代码审查

### 已正确处理的地方

**1. Quotation.create 方法**

```javascript
// backend/models/Quotation.js
const result = stmt.run(
    ...
    data.include_freight_in_base !== false ? 1 : 0  // ✅ 已转换
);
```

**2. 创建报价单（控制器）**

```javascript
// backend/controllers/costController.js - createQuotation
const quotationId = Quotation.create({
    ...
    include_freight_in_base: req.body.include_freight_in_base !== false,  // ✅ 在 create 方法中转换
    ...
});
```

### 已修复的地方

**3. 更新报价单（控制器）**

```javascript
// backend/controllers/costController.js - updateQuotation
Quotation.update(id, {
    ...
    include_freight_in_base: req.body.include_freight_in_base !== false ? 1 : 0,  // ✅ 已修复
});
```

## 其他可能需要注意的布尔字段

检查项目中其他使用布尔值的地方：

### 1. is_active 字段

```javascript
// regulations, models, materials 等表
is_active: data.is_active ? 1 : 0
```

### 2. is_changed 字段

```javascript
// quotation_items 表
is_changed: item.is_changed ? 1 : 0
```

### 3. from_standard 字段

```javascript
// 前端使用的标记
from_standard: false  // 这个只在前端使用，不存入数据库
```

## 测试验证

### 测试步骤

1. 创建一个新报价单
2. 选择"运费计入成本：是"
3. 保存草稿 → 应该成功
4. 编辑该报价单
5. 修改"运费计入成本：否"
6. 保存 → 应该成功
7. 查看数据库，验证 `include_freight_in_base` 字段为 0 或 1

### 验证数据库

```sql
SELECT id, customer_name, include_freight_in_base 
FROM quotations 
ORDER BY id DESC 
LIMIT 5;
```

预期结果：
```
id | customer_name | include_freight_in_base
1  | 客户A         | 1
2  | 客户B         | 0
3  | 客户C         | 1
```

## 最佳实践

### 1. 统一处理布尔值

在模型层统一处理布尔值转换：

```javascript
// 好的做法：在模型中转换
static create(data) {
    const stmt = db.prepare(`...`);
    const result = stmt.run(
        ...
        data.is_active ? 1 : 0,
        data.include_freight ? 1 : 0
    );
}
```

### 2. 使用辅助函数

创建一个辅助函数处理布尔值：

```javascript
function toBool(value) {
    return value ? 1 : 0;
}

// 使用
stmt.run(toBool(data.is_active));
```

### 3. 类型验证

在控制器层验证数据类型：

```javascript
if (typeof req.body.include_freight_in_base !== 'boolean') {
    return res.status(400).json(error('参数类型错误', 400));
}
```

## 修改文件清单

### 修改文件
- `backend/controllers/costController.js`
  - 修复 `updateQuotation` 函数中的布尔值转换

### 新建文件
- `BUGFIX-SQLITE-BOOLEAN-20251103.md` - 本文档

## 完成状态

- ✅ 识别问题根源
- ✅ 修复布尔值转换
- ✅ 代码诊断通过
- ✅ 文档编写完成

## 总结

SQLite 不支持布尔类型，所有布尔值必须转换为整数（0 或 1）后才能存储。在使用 SQLite 时，要特别注意：

1. **写入时**：将布尔值转换为整数
2. **读取时**：整数会自动转换为布尔值（JavaScript 的真值判断）
3. **统一处理**：在模型层或控制器层统一处理转换逻辑

修复完成！
