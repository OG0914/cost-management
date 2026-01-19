# 系统逻辑问题修复计划

> 创建时间: 2026-01-13
> 状态: 待审核

---

## 一、高优先级修复

### 1.1 `readonly` 角色权限统一

**问题**: 前端允许 `readonly` 访问成本页面，但后端API返回403

**方案A - 允许 readonly 访问成本模块（只读）**:
```
前端: 保持现状，readonly 可进入成本页面
后端: costRoutes.js 添加 readonly 到允许角色列表
```

**方案B - 禁止 readonly 访问成本模块**:
```
前端: router/index.js 的 forbidPurchaserProducer 改为 forbidNonSales
       禁止 purchaser/producer/readonly 访问成本页面
后端: 保持现状
```

**推荐**: 方案A，readonly 角色的设计初衷就是"只读查看"

**修改文件**:
- `backend/routes/costRoutes.js` - 添加 readonly 到 GET 路由

```javascript
// 修改前
router.get('/quotations', checkRole('admin', 'reviewer', 'salesperson'), ...)
router.get('/quotations/:id', checkRole('admin', 'reviewer', 'salesperson'), ...)

// 修改后
router.get('/quotations', checkRole('admin', 'reviewer', 'salesperson', 'readonly'), ...)
router.get('/quotations/:id', checkRole('admin', 'reviewer', 'salesperson', 'readonly'), ...)
```

---

### 1.2 禁止审核人审核自己创建的报价单

**问题**: 审核人可以创建报价单并自己审核，缺乏制约

**修改文件**: `backend/controllers/review/reviewController.js`

**approveQuotation 函数添加检查**:
```javascript
// 在状态检查后添加
if (quotation.created_by === reviewerId) {
  return res.status(403).json(error('不能审核自己创建的报价单', 403));
}
```

**rejectQuotation 函数添加检查**:
```javascript
// 在状态检查后添加
if (quotation.created_by === reviewerId) {
  return res.status(403).json(error('不能退回自己创建的报价单', 403));
}
```

**前端提示**: `ReviewDetailDialog.vue` 添加提示信息

---

## 二、中优先级修复

### 2.1 外销运费验证

**问题**: 外销时运费是必填项，但后端没有强制校验

**修改文件**: `backend/controllers/costController.js`

**createQuotation 和 updateQuotation 添加验证**:
```javascript
// 外销必须填写运费
if (sales_type === 'export' && (!freight_total || freight_total <= 0)) {
  return res.status(400).json(error('外销报价必须填写运费', 400));
}
```

---

### 2.2 报价单明细验证

**问题**: 未验证 items 数组是否为空

**修改文件**: `backend/controllers/costController.js`

**createQuotation 添加验证**:
```javascript
// 验证明细数据
if (!items || !Array.isArray(items) || items.length === 0) {
  return res.status(400).json(error('请至少添加一项成本明细', 400));
}
```

---

### 2.3 标准成本删除前检查

**问题**: 删除标准成本时未检查是否被引用

**修改文件**: `backend/controllers/review/standardCostController.js`

**deleteStandardCost 添加检查**:
```javascript
// 检查是否有报价单基于此标准成本创建（可选：根据业务需求决定是否阻止删除）
// 目前标准成本删除不影响已创建的报价单，仅记录日志警告
```

**决策点**: 是否允许删除被引用的标准成本？建议允许，但记录日志。

---

### 2.4 重新提交修改检查（可选）

**问题**: 被退回的报价单可直接重新提交，无需修改

**方案A - 不强制修改**:
- 保持现状，信任业务员已做修改
- 审核人可再次退回

**方案B - 强制修改**:
- 在 quotations 表添加 `content_hash` 字段
- 退回时记录当前内容hash
- 重新提交时检查内容是否变化

**推荐**: 方案A，避免过度设计。审核流程本身就是制约机制。

---

## 三、低优先级修复

### 3.1 分页参数命名统一

**问题**: review 用 `page_size`，cost 用 `pageSize`

**方案**: 统一使用 `pageSize` (驼峰命名)

**修改文件**:
- `backend/controllers/review/reviewController.js`
- `frontend/src/store/review.js`

**修改内容**:
```javascript
// 后端：同时支持两种命名，优先 pageSize
const pageSizeNum = Math.min(100, Math.max(1, parseInt(page_size || pageSize) || 20));

// 前端：统一使用 pageSize
params: { page, pageSize, keyword }
```

---

### 3.2 Dashboard 角色过滤完善

**问题**: `readonly` 不应调用待审核接口

**修改文件**: `frontend/src/views/Dashboard.vue`

```javascript
// 修改前
const excludedRoles = ['producer', 'purchaser']

// 修改后
const excludedRoles = ['producer', 'purchaser', 'readonly']
```

---

### 3.3 客户归属后端校验（可选）

**问题**: 后端没有校验客户归属

**方案**: 添加警告日志，不阻止操作

**原因**: 
- 业务上可能需要帮他人客户报价
- 前端已有确认提示
- 强制限制可能影响业务灵活性

---

## 四、修复任务清单

| 序号 | 任务 | 文件 | 优先级 | 预估工时 |
|:----:|------|------|:------:|:--------:|
| 1 | readonly 路由权限 | costRoutes.js | 高 | 5分钟 |
| 2 | 禁止自审核-approve | reviewController.js | 高 | 5分钟 |
| 3 | 禁止自审核-reject | reviewController.js | 高 | 5分钟 |
| 4 | 前端自审核提示 | ReviewDetailDialog.vue | 高 | 10分钟 |
| 5 | 外销运费验证 | costController.js | 中 | 5分钟 |
| 6 | 明细数据验证 | costController.js | 中 | 5分钟 |
| 7 | 分页参数兼容 | reviewController.js | 低 | 10分钟 |
| 8 | Dashboard角色过滤 | Dashboard.vue | 低 | 2分钟 |

**总预估工时**: 约 47 分钟

---

## 五、测试验证清单

- [ ] readonly 用户可访问成本记录页面
- [ ] readonly 用户可查看报价单详情
- [ ] readonly 用户不能创建/编辑/删除报价单
- [ ] 审核人不能审核自己创建的报价单
- [ ] 审核人不能退回自己创建的报价单
- [ ] 外销报价单必须填写运费
- [ ] 创建报价单必须有明细数据
- [ ] 分页参数 pageSize 和 page_size 都能正常工作
