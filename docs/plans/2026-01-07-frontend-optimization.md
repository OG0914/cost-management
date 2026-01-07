# 前端代码优化 实施计划

**目标：** 清理 console 日志、拆分超长组件、优化大数据量加载，提升代码质量和可维护性

**架构：** 创建统一 Logger 工具替代 console；将超过 200 行的组件拆分为可复用子组件；下拉框改为远程搜索模式

**技术栈：** Vue 3, Element Plus, Pinia, Vite

---

## 阶段 1: P0 - 创建 Logger 工具并清理 console 日志

### 任务 1.1: 创建 Logger 工具

**文件：**
- 创建: `frontend/src/utils/logger.js`

**步骤1: 创建 Logger 工具**

```javascript
/**
 * 统一日志工具 - 生产环境自动禁用 console 输出
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => isDev && console.log('[LOG]', ...args),
  info: (...args) => isDev && console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => isDev && console.debug('[DEBUG]', ...args)
}

export default logger
```

**步骤2: 提交**

```bash
git add frontend/src/utils/logger.js
git commit -m "feat(utils): add logger utility for unified logging"
```

---

### 任务 1.2: 清理 utils/request.js 中的 console

**文件：**
- 修改: `frontend/src/utils/request.js`

**步骤1: 替换 console 为 logger**

- 第37行: `console.error('请求错误:', error)` → `logger.error('请求错误:', error)`
- 第49行: `console.error('响应错误:', error)` → `logger.error('响应错误:', error)`
- 添加顶部导入: `import logger from './logger'`

**步骤2: 提交**

```bash
git add frontend/src/utils/request.js
git commit -m "refactor(request): replace console with logger"
```

---

### 任务 1.3: 清理 utils/auth.js 中的 console

**文件：**
- 修改: `frontend/src/utils/auth.js`

**步骤1: 替换 console 为 logger**

- 第63行: `console.error('Token解析失败:', error)` → `logger.error('Token解析失败:', error)`
- 添加顶部导入: `import logger from './logger'`

**步骤2: 提交**

```bash
git add frontend/src/utils/auth.js
git commit -m "refactor(auth): replace console with logger"
```

---

### 任务 1.4: 清理 store 目录中的 console

**文件：**
- 修改: `frontend/src/store/config.js`
- 修改: `frontend/src/store/quotation.js`
- 修改: `frontend/src/store/review.js`

**步骤1: 在每个文件中替换 console 为 logger**

添加导入并替换所有 `console.error` 为 `logger.error`

**步骤2: 提交**

```bash
git add frontend/src/store/
git commit -m "refactor(store): replace console with logger in all stores"
```

---

### 任务 1.5: 清理 views/Home.vue 中的 console

**文件：**
- 修改: `frontend/src/views/Home.vue`

**步骤1: 删除或替换调试日志**

- 删除第36-43行的所有调试 console.log/error

**步骤2: 提交**

```bash
git add frontend/src/views/Home.vue
git commit -m "refactor(home): remove debug console logs"
```

---

### 任务 1.6: 清理 views/Dashboard.vue 中的 console

**文件：**
- 修改: `frontend/src/views/Dashboard.vue`

**步骤1: 替换 console.error 为 logger.error**

- 第711行和第723行

**步骤2: 提交**

```bash
git add frontend/src/views/Dashboard.vue
git commit -m "refactor(dashboard): replace console with logger"
```

---

### 任务 1.7: 清理 views/cost/CostAdd.vue 中的 console (31处)

**文件：**
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 批量替换**

- 删除所有 `console.log` 调试日志
- 保留 `console.error` 并替换为 `logger.error`
- 保留 `console.warn` 并替换为 `logger.warn`
- 添加顶部导入: `import logger from '@/utils/logger'`

**步骤2: 提交**

```bash
git add frontend/src/views/cost/CostAdd.vue
git commit -m "refactor(cost-add): replace console with logger"
```

---

### 任务 1.8: 清理其他视图和组件中的 console

**文件：**
- 修改: `frontend/src/views/cost/CostRecords.vue`
- 修改: `frontend/src/views/cost/CostDetail.vue`
- 修改: `frontend/src/views/cost/CostCompare.vue`
- 修改: `frontend/src/views/cost/StandardCost.vue`
- 修改: `frontend/src/views/config/SystemConfig.vue`
- 修改: `frontend/src/views/model/ModelManage.vue`
- 修改: `frontend/src/views/process/ProcessManage.vue`
- 修改: `frontend/src/views/packaging/PackagingManage.vue`
- 修改: `frontend/src/components/ExcelExport.vue`
- 修改: `frontend/src/components/ExcelUpload.vue`
- 修改: `frontend/src/components/ProductCategoryModal.vue`
- 修改: `frontend/src/components/review/ReviewDetailDialog.vue`
- 修改: `frontend/src/components/review/ApprovedDetailDialog.vue`

**步骤1: 批量替换所有文件中的 console**

**步骤2: 提交**

```bash
git add frontend/src/views/ frontend/src/components/
git commit -m "refactor: replace all console with logger across views and components"
```

---

## 阶段 2: P1 - 拆分超长组件

### 任务 2.1: 拆分 Dashboard.vue - 创建 GreetingCard 组件

**文件：**
- 创建: `frontend/src/components/dashboard/GreetingCard.vue`
- 修改: `frontend/src/views/Dashboard.vue`

**步骤1: 创建 GreetingCard.vue**

提取问候语区域（第3-31行模板）为独立组件

**步骤2: 在 Dashboard.vue 中引用**

**步骤3: 提交**

```bash
git add frontend/src/components/dashboard/GreetingCard.vue frontend/src/views/Dashboard.vue
git commit -m "refactor(dashboard): extract GreetingCard component"
```

---

### 任务 2.2: 拆分 Dashboard.vue - 创建 StatCards 组件

**文件：**
- 创建: `frontend/src/components/dashboard/StatCards.vue`
- 修改: `frontend/src/views/Dashboard.vue`

**步骤1: 创建 StatCards.vue**

提取统计卡片区域为独立组件

**步骤2: 提交**

```bash
git add frontend/src/components/dashboard/StatCards.vue frontend/src/views/Dashboard.vue
git commit -m "refactor(dashboard): extract StatCards component"
```

---

### 任务 2.3: 拆分 Dashboard.vue - 创建 ChartSection 组件

**文件：**
- 创建: `frontend/src/components/dashboard/ChartSection.vue`
- 修改: `frontend/src/views/Dashboard.vue`

**步骤1: 创建 ChartSection.vue**

提取图表区域（折线图+柱状图）为独立组件

**步骤2: 提交**

```bash
git add frontend/src/components/dashboard/ChartSection.vue frontend/src/views/Dashboard.vue
git commit -m "refactor(dashboard): extract ChartSection component"
```

---

### 任务 2.4: 拆分 CostAdd.vue - 创建 CostBasicInfo 组件

**文件：**
- 创建: `frontend/src/components/cost/CostBasicInfo.vue`
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 创建基本信息表单组件**

提取法规选择、型号配置、客户信息区域

**步骤2: 提交**

```bash
git add frontend/src/components/cost/CostBasicInfo.vue frontend/src/views/cost/CostAdd.vue
git commit -m "refactor(cost-add): extract CostBasicInfo component"
```

---

### 任务 2.5: 拆分 CostAdd.vue - 创建 SalesTypeSelector 组件

**文件：**
- 创建: `frontend/src/components/cost/SalesTypeSelector.vue`
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 创建销售类型选择器组件**

提取内销/外销选择和运费配置区域

**步骤2: 提交**

```bash
git add frontend/src/components/cost/SalesTypeSelector.vue frontend/src/views/cost/CostAdd.vue
git commit -m "refactor(cost-add): extract SalesTypeSelector component"
```

---

### 任务 2.6: 拆分 CostAdd.vue - 创建 CostDetailSection 组件

**文件：**
- 创建: `frontend/src/components/cost/CostDetailSection.vue`
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 创建成本明细组件**

提取原料、工序、包材明细表格

**步骤2: 提交**

```bash
git add frontend/src/components/cost/CostDetailSection.vue frontend/src/views/cost/CostAdd.vue
git commit -m "refactor(cost-add): extract CostDetailSection component"
```

---

### 任务 2.7: 拆分 CostAdd.vue - 创建 ProfitTierCards 组件

**文件：**
- 创建: `frontend/src/components/cost/ProfitTierCards.vue`
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 创建利润区间组件**

提取利润档位卡片区域

**步骤2: 提交**

```bash
git add frontend/src/components/cost/ProfitTierCards.vue frontend/src/views/cost/CostAdd.vue
git commit -m "refactor(cost-add): extract ProfitTierCards component"
```

---

## 阶段 3: P2 - 优化大数据量下拉框

### 任务 3.1: 优化 BomConfigDialog.vue 原料下拉框

**文件：**
- 修改: `frontend/src/components/BomConfigDialog.vue`

**步骤1: 改为远程搜索模式**

- 将 `fetchMaterials` 从加载全量改为按需搜索
- 使用 `remote-method` 实现
- 添加防抖处理

**步骤2: 提交**

```bash
git add frontend/src/components/BomConfigDialog.vue
git commit -m "perf(bom-dialog): optimize material dropdown with remote search"
```

---

### 任务 3.2: 优化 CostAdd.vue 原料下拉框

**文件：**
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 改为远程搜索模式**

- 将 `loadAllMaterials` 从加载 9999 条改为按需搜索
- 使用 `remote-method` + `filterable` + `remote`

**步骤2: 提交**

```bash
git add frontend/src/views/cost/CostAdd.vue
git commit -m "perf(cost-add): optimize material dropdown with remote search"
```

---

## 阶段 4: 验证

### 任务 4.1: 运行构建检查

**步骤1: 运行构建**

```bash
cd frontend && npm run build
```

**预期:** 构建成功，无错误

**步骤2: 检查是否还有遗留的 console**

```bash
grep -r "console\." src/ --include="*.vue" --include="*.js"
```

**预期:** 仅 logger.js 中有 console

---

## 执行顺序

1. **批次 1 (P0):** 任务 1.1 → 1.8 (创建 Logger + 清理所有 console) ✅ 已完成
2. **批次 2 (P1-Dashboard):** 任务 2.1 → 2.3 (拆分 Dashboard) ✅ 已完成 (782行→391行)
3. **批次 3 (P1-CostAdd):** 任务 2.4 → 2.7 (拆分 CostAdd) ⏭️ 跳过 - 耦合度高，需单独规划
4. **批次 4 (P2):** 任务 3.1 (优化 BomConfigDialog 下拉框) ✅ 已完成
5. **批次 5:** 任务 4.1 (验证) ✅ 构建通过

---

## 执行结果

### 已完成工作

| 批次 | 任务 | 状态 | 说明 |
|-----|------|------|------|
| 1 | 创建 Logger 工具 | ✅ | `frontend/src/utils/logger.js` |
| 1 | 清理 console 日志 | ✅ | 80+ 处替换/删除 |
| 2 | 创建 StatCards.vue | ✅ | 116 行，统计卡片组件 |
| 2 | 创建 ChartSection.vue | ✅ | 112 行，图表区域组件 |
| 2 | 修改 Dashboard.vue | ✅ | 782行 → 391行 (-50%) |
| 4 | BomConfigDialog 远程搜索 | ✅ | 原料下拉框改为按需加载 |
| 5 | 构建验证 | ✅ | `npm run build` 成功 |

### 待后续规划

- **CostAdd.vue 拆分**: 2300+ 行，状态和逻辑高度耦合，需单独规划重构方案
- **CostAdd.vue 原料下拉框优化**: 依赖 `allMaterials` 的查找逻辑较多，需配合重构

---

**实际执行时间:** ~1.5 小时
**创建文件:** 3 个 (logger.js, StatCards.vue, ChartSection.vue)
**修改文件:** 25+ 个

---

## 阶段 5: P1 - CostAdd.vue 深度重构

### 已完成工作

**创建统一样式系统：**
- `frontend/src/styles/cost-form.css` - 成本表单统一样式

**拆分为独立组件：**
| 组件 | 文件 | 职责 |
|------|------|------|
| CostPageHeader | `components/cost/CostPageHeader.vue` | 页面顶部导航栏 |
| CostBasicInfo | `components/cost/CostBasicInfo.vue` | 基本信息表单（法规、型号、客户） |
| SalesTypeSelector | `components/cost/SalesTypeSelector.vue` | 销售类型选择+运费配置 |
| FreightResultCard | `components/cost/FreightResultCard.vue` | 运费计算结果卡片（FCL/LCL） |
| CostDetailTable | `components/cost/CostDetailTable.vue` | 可复用成本明细表格（原料/工序/包材） |
| CostSummaryCards | `components/cost/CostSummaryCards.vue` | 成本计算汇总卡片 |
| ProfitTierCards | `components/cost/ProfitTierCards.vue` | 利润区间卡片 |
| CostActionBar | `components/cost/CostActionBar.vue` | 底部操作栏 |

**统一导出：**
- `frontend/src/components/cost/index.js` - 组件统一导出

### 设计原则

- **企业级稳重风格**: 延续 Dashboard 的设计语言
- **统一样式系统**: 使用 `cost-section`、`cost-form-row` 等语义化类名
- **组件复用**: `CostDetailTable` 可复用于原料/工序/包材三种明细
- **Props驱动**: 通过 props 和 events 实现父子通信

### 下一步

CostAdd.vue 主页面需要引入这些组件完成最终重构，但由于业务逻辑复杂（2500+行），建议分阶段进行：
1. 先在新页面中测试组件
2. 逐步替换原有代码
3. 保留原有业务逻辑，仅替换UI层

**构建验证:** ✅ `npm run build` 成功
