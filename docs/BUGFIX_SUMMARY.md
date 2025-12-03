# 自定义利润档位Bug修复及优化说明

## 第一轮问题描述

用户报告了两个问题：

1. **问题1**：在点击添加档位时，默认值是0.35，改成0.6后再点击新增，刚才输入的0.6又变成0.35
2. **问题2**：无论输入什么数字，最后提交保存或者审核都是0.35

## 根本原因

在`allProfitTiers`计算属性中，我们使用了展开运算符（`...tier`）来创建新对象：

```javascript
// 问题代码
const customTiers = customProfitTiers.value.map(tier => ({
  ...tier,  // 这里创建了新对象
  isCustom: true
}))
```

这导致在表格中显示的`row`对象是一个**新创建的副本**，而不是`customProfitTiers`数组中的原始对象。

当用户在输入框中修改`row.profitRate`时：
- 修改的是这个临时副本对象
- `customProfitTiers`数组中的原始对象没有被修改
- 下次计算属性重新计算时，又会创建新的副本，之前的修改丢失

## 解决方案

### 修改1：在allProfitTiers中保留对原始对象的引用

```javascript
// 修复后的代码
const customTiers = customProfitTiers.value.map((tier, index) => ({
  profitRate: tier.profitRate,
  profitPercentage: tier.profitPercentage,
  price: tier.price,
  isCustom: true,
  originalTier: tier,  // 保留对原始对象的引用
  customIndex: index   // 保存在customProfitTiers中的索引
}))
```

现在每个显示的档位对象都包含：
- `originalTier`：指向`customProfitTiers`数组中的原始对象
- `customIndex`：该档位在`customProfitTiers`数组中的索引

### 修改2：在模板中直接修改原始对象

```vue
<!-- 修复前 -->
<el-input
  v-model.number="row.profitRate"  <!-- 修改的是副本 -->
  @input="updateCustomTierPrice(row)"
/>

<!-- 修复后 -->
<el-input
  v-model.number="row.originalTier.profitRate"  <!-- 修改的是原始对象 -->
  @input="updateCustomTierPrice(row.originalTier)"
/>
```

### 修改3：简化删除函数

```javascript
// 修复前
const removeCustomProfitTier = (index) => {
  const systemTiersCount = calculation.value?.profitTiers?.length || 0
  const customIndex = index - systemTiersCount
  // 需要计算实际索引
}

// 修复后
const removeCustomProfitTier = (customIndex) => {
  // 直接使用保存的索引
  if (customIndex >= 0 && customIndex < customProfitTiers.value.length) {
    customProfitTiers.value.splice(customIndex, 1)
  }
}
```

## 技术要点

### Vue 3 响应式系统

Vue 3 的响应式系统基于 Proxy，可以追踪对象属性的变化。但是：

1. **对象引用很重要**：修改对象的属性会触发响应式更新，但修改的必须是被追踪的对象
2. **展开运算符创建新对象**：`{...obj}`会创建一个新对象，这个新对象不在响应式系统的追踪范围内
3. **计算属性每次都重新计算**：当依赖变化时，计算属性会重新执行，返回新的结果

### 正确的做法

当需要在计算属性中展示数组数据，并且需要在UI中修改这些数据时：

1. **保留原始引用**：在计算属性返回的对象中保留对原始数据的引用
2. **直接修改原始数据**：在模板中通过引用直接修改原始数据
3. **避免创建不必要的副本**：除非确实需要，否则不要使用展开运算符

## 测试验证

修复后，请验证以下场景：

1. ✅ 添加新档位，默认值为0.35
2. ✅ 修改档位的利润率为0.6，值保持为0.6
3. ✅ 再次添加新档位，新档位默认为0.35，之前的0.6保持不变
4. ✅ 修改多个档位的值，所有修改都能保存
5. ✅ 点击保存草稿，所有自定义档位的值正确保存到数据库
6. ✅ 点击提交审核，所有自定义档位的值正确保存到数据库
7. ✅ 重新打开报价单，自定义档位的值正确显示
8. ✅ 删除档位功能正常工作

## 修改的文件

- `frontend/src/views/cost/CostAdd.vue`
  - 修改了`allProfitTiers`计算属性
  - 修改了利润区间报价表的模板
  - 简化了`removeCustomProfitTier`函数

## 总结

这是一个典型的Vue响应式系统使用问题。关键是要理解：
- 计算属性返回的数据如果是新创建的对象，修改它不会影响原始数据
- 需要在UI中修改的数据，必须保持对原始响应式对象的引用
- 使用展开运算符时要特别小心，它会破坏对象引用关系

修复后，用户的输入会直接修改`customProfitTiers`数组中的原始对象，Vue的响应式系统会正确追踪这些变化，保存时也会使用正确的值。

---

## 第二轮优化需求

用户提出了两个优化需求：

1. **需求1**：添加档位时，不要默认给出任何值
2. **需求2**：等用户保存之后再排序（编辑时不排序）

## 优化实现

### 优化1：移除默认值

**修改前**：
```javascript
customProfitTiers.value.push({
  profitRate: 0.35, // 默认35%
  profitPercentage: '35%',
  price: 0
})
```

**修改后**：
```javascript
customProfitTiers.value.push({
  profitRate: null, // 不设置默认值
  profitPercentage: '',
  price: 0
})
```

**相关改动**：
- 在`updateCustomTierPrice`函数中添加空值检查
- 在模板中添加条件渲染，只在有值时显示百分比

### 优化2：保存时排序，编辑时保持顺序

**修改前**：
```javascript
// allProfitTiers计算属性中
const allTiers = [...systemTiers, ...customTiers]
allTiers.sort((a, b) => a.profitRate - b.profitRate) // 立即排序
return allTiers
```

**修改后**：
```javascript
// allProfitTiers计算属性中 - 不排序
const allTiers = [...systemTiers, ...customTiers]
return allTiers // 保持添加顺序

// 新增prepareCustomProfitTiersForSave函数 - 保存时排序
const prepareCustomProfitTiersForSave = () => {
  return customProfitTiers.value
    .filter(tier => tier.profitRate !== null && tier.profitRate !== undefined && tier.profitRate !== '')
    .map(tier => ({
      profitRate: tier.profitRate,
      profitPercentage: tier.profitPercentage,
      price: tier.price
    }))
    .sort((a, b) => a.profitRate - b.profitRate) // 保存时排序
}
```

### 优化3：保存时过滤空值

在`prepareCustomProfitTiersForSave`函数中，添加了过滤逻辑：
- 过滤掉`profitRate`为`null`、`undefined`或空字符串的档位
- 只保存有效的档位数据
- 避免保存未填写的空档位

## 用户体验改进

### 改进前的问题
1. 添加档位时有默认值0.35，用户可能不需要这个值
2. 编辑时档位会自动排序，打乱用户的添加顺序
3. 用户可能添加了空档位但忘记填写，会保存无效数据

### 改进后的体验
1. ✅ 添加档位时输入框为空，用户可以自由输入任何值
2. ✅ 编辑时档位保持添加顺序，不会自动重排
3. ✅ 保存时自动过滤空档位，只保存有效数据
4. ✅ 保存时自动排序，确保数据库中的数据有序
5. ✅ 重新打开报价单时，档位按排序后的顺序显示

## 技术细节

### 空值处理
```javascript
// 在updateCustomTierPrice中
if (tier.profitRate === null || tier.profitRate === undefined || tier.profitRate === '') {
  tier.price = 0
  tier.profitPercentage = ''
  return
}
```

### 条件渲染百分比
```vue
<template #append>
  <span v-if="row.originalTier.profitRate !== null && row.originalTier.profitRate !== ''">
    {{ (row.originalTier.profitRate * 100).toFixed(0) }}%
  </span>
</template>
```

### 保存时的数据处理流程
1. 过滤：移除空值档位
2. 映射：提取需要的字段
3. 排序：按利润率从低到高排序
4. 保存：发送到后端

## 测试验证

优化后，请验证以下场景：

1. ✅ 添加新档位，输入框为空，无默认值
2. ✅ 输入利润率后，自动显示百分比和报价
3. ✅ 添加多个档位，保持添加顺序，不自动排序
4. ✅ 保存时，空档位被过滤掉
5. ✅ 保存时，有效档位按百分比排序
6. ✅ 重新打开报价单，档位按排序后的顺序显示
7. ✅ 删除档位功能正常工作
8. ✅ 修改档位值后保存，修改生效

## 修改的文件

- `frontend/src/views/cost/CostAdd.vue`
  - 修改了`addCustomProfitTier`函数（移除默认值）
  - 修改了`allProfitTiers`计算属性（移除排序）
  - 新增了`prepareCustomProfitTiersForSave`函数（保存时排序和过滤）
  - 修改了`updateCustomTierPrice`函数（添加空值处理）
  - 修改了模板中的百分比显示（条件渲染）
  - 修改了`saveDraft`和`submitQuotation`函数（使用新的准备函数）

## 总结

这次优化主要关注用户体验：
- **灵活性**：不强制默认值，让用户自由输入
- **可控性**：编辑时保持顺序，不自动重排
- **数据质量**：保存时过滤空值，确保数据有效性
- **一致性**：保存时排序，确保数据库中的数据有序

这些改进让功能更加符合用户的实际使用习惯。
