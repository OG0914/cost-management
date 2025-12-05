# Design Document: 管销后自定义费用

## Overview

本功能在成本计算流程中，于管销价计算完成后增加自定义费用功能。用户可以添加多个费用项（如关税、服务费等），系统按顺序累乘计算，最终得到总结金额用于后续成本计算。

### 计算流程

```
管销价 → 自定义费用累乘 → 总结金额 → ÷汇率 → ×保险率 → 最终成本价(外销)
管销价 → 自定义费用累乘 → 总结金额 → ×(1+增值税率) → 最终成本价(内销)
```

### 累乘计算示例

```
管销价: 1.0000 CNY
关税 4%: 1.0000 × 1.04 = 1.0400 CNY
服务费 10%: 1.0400 × 1.10 = 1.1440 CNY
总结: 1.1440 CNY
外销价: 1.1440 ÷ 7 = 0.1634 USD
最终成本价: 0.1634 × 1.003 = 0.1639 USD
```

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vue.js)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CostAdd.vue                             │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  自定义费用区域                              │    │    │
│  │  │  - 添加按钮                                  │    │    │
│  │  │  - 费用列表                                  │    │    │
│  │  │  - 总结行                                    │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Node.js)                       │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ costController  │  │ CostCalculator  │                   │
│  │ - 保存费用      │  │ - 累乘计算      │                   │
│  │ - 加载费用      │  │ - 总结计算      │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (SQLite)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  quotation_custom_fees                               │    │
│  │  - id, quotation_id, fee_name, fee_rate, sort_order │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 前端组件

#### CostAdd.vue 修改

在成本计算区域的管销价下方添加自定义费用区域：

```vue
<!-- 自定义费用区域 -->
<el-descriptions-item label="自定义费用">
  <div class="custom-fees-area">
    <el-button size="small" @click="showAddFeeDialog">+ 添加</el-button>
    <div v-if="customFees.length > 0" class="fee-list">
      <div v-for="(fee, index) in customFees" :key="index" class="fee-item">
        <span>├─ {{ fee.name }} {{ (fee.rate * 100).toFixed(0) }}%</span>
        <el-button size="small" type="danger" @click="removeFee(index)">🗑️</el-button>
      </div>
      <div class="fee-summary">
        <span>└─ 总结 {{ formatNumber(customFeeSummary) }} CNY</span>
      </div>
    </div>
  </div>
</el-descriptions-item>
```

#### 添加费用对话框

```vue
<el-dialog v-model="addFeeDialogVisible" title="添加自定义费用" width="400px">
  <el-form :model="newFee" :rules="feeRules" ref="feeFormRef">
    <el-form-item label="费用名称" prop="name">
      <el-input v-model="newFee.name" placeholder="请输入费用名称" />
    </el-form-item>
    <el-form-item label="费率" prop="rate">
      <el-input-number v-model="newFee.rate" :min="0.001" :max="1" :precision="4" :step="0.01" placeholder="请输入费率" />
      <span v-if="newFee.rate" style="margin-left: 10px;">{{ (newFee.rate * 100).toFixed(0) }}%</span>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="addFeeDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="confirmAddFee">确定</el-button>
  </template>
</el-dialog>
```

#### 新费用初始化（无预填值）

```javascript
const newFee = reactive({
  name: '',
  rate: null
});

const showAddFeeDialog = () => {
  newFee.name = '';
  newFee.rate = null;
  addFeeDialogVisible.value = true;
};
```

### 2. 后端接口

#### CostCalculator 类扩展

```javascript
/**
 * 计算自定义费用累乘结果
 * @param {number} basePrice - 基础价格（管销价）
 * @param {Array<{name: string, rate: number}>} customFees - 自定义费用列表
 * @returns {number} 累乘计算后的总结金额
 */
calculateCustomFeesSummary(basePrice, customFees = []) {
  if (!customFees || customFees.length === 0) {
    return basePrice;
  }
  
  let result = basePrice;
  for (const fee of customFees) {
    result = result * (1 + fee.rate);
  }
  return this._round(result, 4);
}
```

#### calculateQuotation 方法修改

```javascript
calculateQuotation(params) {
  // ... 现有代码 ...
  
  const { customFees = [] } = params;
  
  // 计算管销价
  const overheadPrice = this.calculateOverheadPrice(baseCost);
  
  // 计算自定义费用总结金额
  const customFeeSummary = this.calculateCustomFeesSummary(overheadPrice, customFees);
  
  // 根据销售类型计算最终价格（使用总结金额替代管销价）
  if (salesType === 'export') {
    exportPrice = customFeeSummary / this.exchangeRate;
    insurancePrice = this.calculateInsurancePrice(exportPrice);
  } else {
    domesticPrice = customFeeSummary * (1 + this.vatRate);
  }
  
  // ... 返回结果 ...
}
```

## Data Models

### 数据库表结构

#### quotation_custom_fees 表

```sql
CREATE TABLE quotation_custom_fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  fee_name TEXT NOT NULL,
  fee_rate REAL NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX idx_custom_fees_quotation ON quotation_custom_fees(quotation_id);
```

### 前端数据结构

```typescript
interface CustomFee {
  id?: number;
  name: string;
  rate: number;
  sortOrder: number;
}

interface QuotationForm {
  // ... 现有字段 ...
  customFees: CustomFee[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 累乘计算正确性

*For any* 管销价和自定义费用列表，累乘计算结果应等于管销价依次乘以每个(1+费率)的结果。

**Validates: Requirements 2.1**

### Property 2: 外销最终成本价计算正确性

*For any* 总结金额、汇率和保险率，外销最终成本价应等于 (总结金额 ÷ 汇率) × (1 + 保险率)。

**Validates: Requirements 2.3**

### Property 3: 内销最终成本价计算正确性

*For any* 总结金额和增值税率，内销最终成本价应等于 总结金额 × (1 + 增值税率)。

**Validates: Requirements 2.4**

### Property 4: 费用数据往返一致性

*For any* 报价单和自定义费用列表，保存后再加载应得到相同的费用配置（名称、费率、顺序）。

**Validates: Requirements 4.1, 4.2**

### Property 5: 费用验证正确性

*For any* 费率输入值，只有大于0的有效数值才能被添加到费用列表。

**Validates: Requirements 5.1**

## Error Handling

### 前端错误处理

1. **费用名称为空**：显示"请输入费用名称"提示
2. **费率无效**：显示"费率必须大于0"提示
3. **网络错误**：显示"保存失败，请重试"提示

### 后端错误处理

1. **数据库写入失败**：返回500错误，记录日志
2. **无效参数**：返回400错误，说明参数问题

## Testing Strategy

### 单元测试

使用 Jest 进行单元测试：

1. **CostCalculator.calculateCustomFeesSummary**
   - 测试空费用列表返回原价
   - 测试单个费用计算
   - 测试多个费用累乘计算

2. **费用验证逻辑**
   - 测试有效费率通过验证
   - 测试无效费率被拒绝

### 属性测试

使用 fast-check 进行属性测试：

1. **累乘计算属性测试**
   - 生成随机管销价和费用列表
   - 验证计算结果符合累乘公式

2. **往返一致性测试**
   - 生成随机费用配置
   - 保存后加载验证数据一致

### 测试配置

- 每个属性测试运行最少100次迭代
- 测试标注格式：`**Feature: custom-fees-after-overhead, Property {number}: {property_text}**`
