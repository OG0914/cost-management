# 大文件拆分方案

> 审计日期: 2026-02-06  
> 文档状态: 方案设计完成，待执行

---

## 📊 目标文件清单

| 优先级 | 文件 | 当前行数 | 目标行数 | 拆分难度 |
|--------|------|----------|----------|----------|
| 🔴 P0 | `CostAdd.vue` | ~1195行 | <200行 | ⭐⭐⭐ 中等（已有部分拆分） |
| 🔴 P0 | `costController.js` | 994行 | <150行/文件 | ⭐⭐ 较易 |
| 🟡 P1 | `CostCompare.vue` | ~1033行 | <200行 | ⭐⭐⭐ 中等 |
| 🟡 P1 | `authController.js` | 416行 | <150行/文件 | ⭐ 简单 |

---

## 🎯 方案A：CostAdd.vue 拆分 (已有良好基础)

### 当前状态分析

项目已经进行了部分优秀的拆分工作：

**已提取的组件：**
- `CostDetailTabs.vue` - 成本明细Tabs (16KB)
- `CostPreviewPanel.vue` - 右侧预览面板 (11KB)
- `FreightCardFCL.vue` - 整柜运费卡片 (4.8KB)
- `FreightCardLCL.vue` - 散货运费卡片 (4KB)
- `FreightCardCIF.vue` - CIF运费卡片 (4.8KB)
- `SalesTypeSection.vue` - 销售类型选择 (7.8KB)
- `SmartPackingTip.vue` - 智能装箱提示 (1.9KB)

**已提取的Composables：**
- `useCostForm.js` - 表单逻辑 (3.2KB)
- `useCustomerLogic.js` - 客户逻辑 (2KB)
- `useDetailRows.js` - 明细行操作 (1.9KB)
- `useEstimationLogic.js` - 预估模式逻辑 (7.2KB)
- `usePackagingLogic.js` - 包装配置逻辑 (5.5KB)
- `useQuotationDetail.js` - 报价单详情逻辑 (5.7KB)

### 继续拆分策略

```
CostAdd.vue (目标: <200行)
├── template: <150行 (仅布局骨架)
├── script: <50行 (仅初始化和路由逻辑)
└── style: 外部CSS文件
```

#### 步骤1: 提取基本信息区块为组件

**新建组件**: `components/BasicInfoSection.vue`

**提取内容** (当前 23-116行):
- 法规标准选择
- 型号配置选择
- 客户名称/地区输入
- 预估模式相关表单

**预计减少**: ~90行

---

#### 步骤2: 提取销售类型区块 (复用现有)

当前 `SalesTypeSection.vue` 已存在但未在 CostAdd 中使用，需要：
1. 完善 `SalesTypeSection.vue` 以包含增值税率和完整的外销运费逻辑
2. 在 CostAdd 中替换相关代码

**预计减少**: ~190行 (120-340行区域)

---

#### 步骤3: 提取数量输入区块

**新建组件**: `components/QuantityInputSection.vue`

**提取内容**:
- 内销数量输入 (274-340行)
- 数量单位切换
- 智能装箱提示
- CBM/箱数显示

**预计减少**: ~60行

---

#### 步骤4: 提取移动端底部栏

**新建组件**: `components/MobileFooterBar.vue`

**提取内容** (390-410行):
- 移动端价格展示
- 操作按钮组

**预计减少**: ~25行

---

#### 步骤5: 提取数据填充逻辑

**新建Composable**: `composables/useDataFill.js`

**提取函数**:
- `fillQuotationData()` (724-765行)
- `fillStandardCostData()` (768-810行以后)

**预计减少**: ~150行

---

#### 步骤6: 提取表单提交逻辑

**新建Composable**: `composables/useFormSubmit.js`

**提取函数**:
- `prepareData()`
- `handleSaveDraft()`
- `handleSubmitQuotation()`
- `handleCancel()`

**预计减少**: ~80行

---

#### 步骤7: 外部化样式

将 `<style>` 部分移至 `styles/cost-add.css`

**预计减少**: ~200-300行

---

### 拆分后预期结构

```
views/cost/
├── CostAdd.vue                    (~180行，仅骨架+初始化)
├── components/
│   ├── BasicInfoSection.vue       (~120行) [新建]
│   ├── SalesTypeSection.vue       (~200行) [增强]
│   ├── QuantityInputSection.vue   (~80行)  [新建]
│   ├── MobileFooterBar.vue        (~40行)  [新建]
│   ├── CostDetailTabs.vue         (已有)
│   ├── CostPreviewPanel.vue       (已有)
│   └── FreightCard*.vue           (已有)
├── composables/
│   ├── useCostForm.js             (已有)
│   ├── useCustomerLogic.js        (已有)
│   ├── useEstimationLogic.js      (已有)
│   ├── usePackagingLogic.js       (已有)
│   ├── useDataFill.js             [新建]
│   └── useFormSubmit.js           [新建]
└── styles/
    └── cost-add.css               [新建]
```

---

## 🎯 方案B：costController.js 拆分

### 当前函数清单

| 函数名 | 行数 | 功能 | 目标模块 |
|--------|------|------|----------|
| `validateQuotationData` | 15行 | 数据验证 | 公共工具 |
| `calculateItemTotals` | 40行 | 计算明细 | 公共工具 |
| `getModelCostParams` | 15行 | 获取参数 | 公共工具 |
| `processVatRate` | 15行 | 处理税率 | 公共工具 |
| `createQuotation` | 150行 | 创建报价单 | CRUD模块 |
| `updateQuotation` | 155行 | 更新报价单 | CRUD模块 |
| `deleteQuotation` | 45行 | 删除报价单 | CRUD模块 |
| `getQuotationList` | 40行 | 列表查询 | CRUD模块 |
| `getQuotationDetail` | 95行 | 详情查询 | CRUD模块 |
| `submitQuotation` | 40行 | 提交审核 | 工作流模块 |
| `calculateQuotation` | 60行 | 计算报价 | 计算模块 |
| `getModelStandardData` | 40行 | 获取标准数据 | 配置模块 |
| `getPackagingConfigs` | 40行 | 获取包装配置 | 配置模块 |
| `getPackagingConfigDetails` | 70行 | 获取配置详情 | 配置模块 |
| `getMaterialCoefficients` | 15行 | 获取系数 | 配置模块 |
| `exportQuotation` | 100行 | 导出Excel | 导出模块 |

### 拆分策略

**已存在的拆分**（发现项目已有部分拆分）:
```
controllers/cost/
├── costConfigController.js      (4.5KB) - 配置相关
├── quotationCrudController.js   (16KB) - CRUD操作
└── quotationWorkflowController.js (4.5KB) - 工作流
```

### 建议的最终结构

```
controllers/cost/
├── index.js                        (~30行) 导出汇总
├── quotationCrudController.js      (~200行) 创建/更新/删除/列表/详情
├── quotationWorkflowController.js  (~80行) 提交/审批流程
├── quotationExportController.js    (~120行) [新建] 导出Excel
├── costConfigController.js         (~150行) 配置获取
└── utils/
    └── quotationHelper.js          (~100行) [新建] 公共工具函数
```

### 具体步骤

#### 步骤1: 提取公共工具函数

**新建**: `controllers/cost/utils/quotationHelper.js`

```javascript
// 移入以下函数:
// - validateQuotationData()
// - calculateItemTotals()
// - getModelCostParams()
// - processVatRate()
```

#### 步骤2: 提取导出功能

**新建**: `controllers/cost/quotationExportController.js`

```javascript
// 移入以下函数:
// - exportQuotation()
```

#### 步骤3: 优化现有CRUD控制器

确认 `quotationCrudController.js` 已包含:
- createQuotation
- updateQuotation
- deleteQuotation
- getQuotationList
- getQuotationDetail

#### 步骤4: 清理主文件

将 `costController.js` 简化为纯导入导出:

```javascript
// costController.js (~20行)
const crud = require('./cost/quotationCrudController');
const workflow = require('./cost/quotationWorkflowController');
const config = require('./cost/costConfigController');
const exportCtrl = require('./cost/quotationExportController');

module.exports = {
  ...crud,
  ...workflow,
  ...config,
  ...exportCtrl
};
```

---

## 🎯 方案C：CostCompare.vue 拆分

### 拆分策略

```
CostCompare.vue (目标: <200行)
├── template: <100行 (布局骨架)
├── script: <100行 (数据加载+事件处理)
```

### 建议提取的组件

| 组件名 | 内容 | 预计行数 |
|--------|------|----------|
| `CompareOverviewCard.vue` | 对比概览卡片 | ~80行 |
| `CompareConfigRow.vue` | 配置信息行 | ~60行 |
| `CompareMaterialRow.vue` | 原料明细对比行 | ~80行 |
| `CompareProcessRow.vue` | 工序明细对比行 | ~70行 |
| `ComparePackagingRow.vue` | 包材明细对比行 | ~70行 |
| `ComparePriceRow.vue` | 价格对比行 | ~80行 |
| `CompareProfitRow.vue` | 利润区间对比行 | ~60行 |

### 建议提取的Composable

**新建**: `composables/useCompareLogic.js`

```javascript
// 移入以下逻辑:
// - 数据加载 (loadCompareData)
// - 价格格式化 (formatNumber)
// - 状态获取 (getStatusType, getStatusText)
// - 利润计算 (getAllProfitTiers)
// - 导出/打印 (handleExport, handlePrint)
```

---

## 🎯 方案D：authController.js 拆分

### 拆分策略 (最简单)

```
controllers/auth/
├── authController.js     (~80行) 登录/注册/密码
├── userController.js     (~150行) [新建] 用户CRUD
└── userImportExport.js   (~100行) [新建] 用户导入导出
```

### 具体划分

| 保留在 authController.js | 移至 userController.js | 移至 userImportExport.js |
|--------------------------|------------------------|--------------------------|
| login | getAllUsers | importUsers |
| register | updateUser | exportUsers |
| getCurrentUser | deleteUser | downloadUserTemplate |
| changePassword | toggleUserStatus | |
| | resetUserPassword | |

---

## 📅 执行计划

### 第一阶段 (1-2天)

**目标**: 后端拆分，风险最低

1. ✅ 创建 `quotationHelper.js` 提取公共函数
2. ✅ 创建 `quotationExportController.js`
3. ✅ 简化 `costController.js` 为汇总导出
4. ✅ 拆分 `authController.js`
5. ✅ 运行测试验证

### 第二阶段 (2-3天)

**目标**: CostAdd.vue 继续拆分

1. ✅ 创建 `BasicInfoSection.vue`
2. ✅ 增强 `SalesTypeSection.vue`
3. ✅ 创建 `QuantityInputSection.vue`
4. ✅ 创建 `useDataFill.js` 和 `useFormSubmit.js`
5. ✅ 外部化样式
6. ✅ 前端功能测试

### 第三阶段 (1-2天)

**目标**: CostCompare.vue 拆分

1. ✅ 创建对比行组件
2. ✅ 创建 `useCompareLogic.js`
3. ✅ 功能验证

---

## ⚠️ 注意事项

1. **保持向后兼容**: 拆分后的模块导出需与现有 API 路由保持一致
2. **分支开发**: 建议在 feature 分支进行，完成后合并
3. **逐步验证**: 每完成一个模块拆分，立即运行相关功能测试
4. **样式隔离**: 使用 scoped CSS 避免样式污染
5. **Props 设计**: 新组件的 Props 应尽量简洁，复杂逻辑通过 Composables 传递

---

## 📝 总结

| 阶段 | 文件 | 预计工时 | 收益 |
|------|------|----------|------|
| 第一阶段 | 后端控制器 | 1-2天 | 代码可读性↑，维护性↑ |
| 第二阶段 | CostAdd.vue | 2-3天 | 1195行→~180行 (85%减少) |
| 第三阶段 | CostCompare.vue | 1-2天 | 1033行→~200行 (80%减少) |

**总工时**: 4-7个工作日

---

老板，以上是完整的拆分方案。请问您希望从哪个阶段开始执行？
