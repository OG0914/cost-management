# 成本计算修复 - 2025-11-04

## 问题描述

1. **工序总计未乘以1.56倍数**：在计算基础成本价时，工序总计应该乘以1.56倍数，但之前的实现中只在前端显示时乘以了1.56，后端计算时使用的是原始值。

2. **利润区间报价计算基准不正确**：利润区间报价应该基于最终成本价（内销为含税价，外销为保险价）计算，但由于第一个问题导致基础成本价计算不正确，最终成本价也不正确。

## 修复内容

### 1. 后端计算器修复 (`backend/utils/costCalculator.js`)

修改了 `calculateBaseCost` 方法，在计算基础成本价时自动将工序总计乘以1.56：

```javascript
calculateBaseCost({ materialTotal, processTotal, packagingTotal, freightCost, includeFreight = true }) {
  // 工序总计需要乘以1.56倍数
  const adjustedProcessTotal = processTotal * 1.56;
  let baseCost = materialTotal + adjustedProcessTotal + packagingTotal;
  if (includeFreight) {
    baseCost += freightCost;
  }
  return this._round(baseCost, 4);
}
```

### 2. 后端控制器修复 (`backend/controllers/costController.js`)

在 `getQuotationDetail` 方法中：
- 移除了手动乘以1.56的代码（因为计算器内部已经处理）
- 添加了 `displayTotal` 字段用于前端显示

```javascript
// 为了前端显示，将工序总计乘以1.56
items.process.displayTotal = items.process.total * 1.56;
```

### 3. 前端代码说明 (`frontend/src/views/cost/CostAdd.vue`)

前端的 `processTotal` computed 属性保持不变，继续显示乘以1.56后的值：

```javascript
const processTotal = computed(() => {
  // 工序总和（显示时乘以1.56系数，但发送给后端时使用原始值）
  const sum = form.processes.reduce((sum, item) => sum + item.subtotal, 0)
  return sum * 1.56
})
```

## 计算公式

### 基础成本价
```
基础成本价 = 原料总计 + 工序总计×1.56 + 包材总计 + 运费成本（可选）
```

### 管销价
```
管销价 = 基础成本价 ÷ (1 - 管销率)
```

### 最终成本价

**内销（含13%增值税）：**
```
最终成本价 = 管销价 × (1 + 增值税率)
```

**外销（保险价）：**
```
外销价 = 管销价 ÷ 汇率
保险价 = 外销价 × (1 + 保险率)
最终成本价 = 保险价
```

### 利润区间报价
```
报价 = 最终成本价 × (1 + 利润率)
```

利润率区间：5%, 10%, 25%, 50%

## 测试验证

运行测试脚本验证修复：
```bash
node backend/scripts/test-cost-calculation.js
```

测试结果：
- ✓ 工序总计已正确乘以1.56倍数
- ✓ 利润区间报价基于最终成本价计算
- ✓ 内销和外销计算逻辑正确

## 影响范围

- 所有新创建的报价单
- 所有更新的报价单
- 报价单详情查询
- 实时成本计算

## 注意事项

1. 前端发送给后端的工序明细使用原始的 `subtotal` 值（未乘以1.56）
2. 后端计算器会自动将工序总计乘以1.56
3. 前端显示时会将工序总计乘以1.56以便用户查看
4. 利润区间报价始终基于最终成本价（含税价或保险价）计算

## 修复文件列表

- `backend/utils/costCalculator.js` - 核心计算逻辑
- `backend/controllers/costController.js` - 控制器逻辑
- `frontend/src/views/cost/CostAdd.vue` - 前端页面（添加注释说明）
- `backend/scripts/test-cost-calculation.js` - 测试脚本（新增）
