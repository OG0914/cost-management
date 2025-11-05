# 修复编辑报价单时包材明细显示空白的问题

## 问题描述
点击编辑报价单时，包材明细没有正确带出名称，显示空白。

## 问题原因
在 `loadQuotationData` 函数中，加载报价单数据时，所有明细项的 `from_standard` 字段都被设置为 `false`。这导致：

1. 在模板中，当 `from_standard` 为 `false` 时，会显示下拉选择框而不是文本
2. 如果 `material_id` 没有值或者不在 `allMaterials` 列表中，下拉框就会显示为空
3. 即使 `item_name` 有值，也不会显示出来

## 解决方案
将加载的明细数据的 `from_standard` 字段设置为 `true`，这样：

1. 默认情况下会显示为文本（`item_name`），而不是下拉框
2. 用户可以通过点击"解锁编辑"按钮来编辑这些数据
3. 解锁后，会显示下拉框，用户可以重新选择原料/包材

## 修改内容

### 1. 修改 `loadQuotationData` 函数
**文件：** `frontend/src/views/cost/CostAdd.vue`

将三个明细数据的 `from_standard` 字段从 `false` 改为 `true`：

```javascript
// 原料明细
form.materials = items.material.items.map(item => ({
  category: 'material',
  material_id: item.material_id || null,
  item_name: item.item_name,
  usage_amount: item.usage_amount,
  unit_price: item.unit_price,
  subtotal: item.subtotal,
  is_changed: item.is_changed || 0,
  from_standard: true // 改为 true
}))

// 工序明细
form.processes = items.process.items.map(item => ({
  category: 'process',
  item_name: item.item_name,
  usage_amount: item.usage_amount,
  unit_price: item.unit_price,
  subtotal: item.subtotal,
  is_changed: item.is_changed || 0,
  from_standard: true // 改为 true
}))

// 包材明细
form.packaging = items.packaging.items.map(item => ({
  category: 'packaging',
  material_id: item.material_id || null,
  item_name: item.item_name,
  usage_amount: item.usage_amount,
  unit_price: item.unit_price,
  subtotal: item.subtotal,
  is_changed: item.is_changed || 0,
  from_standard: true // 改为 true
}))
```

### 2. 为原料明细添加解锁编辑功能
**文件：** `frontend/src/views/cost/CostAdd.vue`

在原料明细的 header 中添加解锁/锁定编辑按钮：

```vue
<div class="section-header">
  <span class="section-title">原料明细</span>
  <div>
    <el-button 
      v-if="!editMode.materials && form.materials.some(p => p.from_standard)" 
      type="warning" 
      size="small" 
      @click="toggleEditMode('materials')"
    >
      解锁编辑
    </el-button>
    <el-button 
      v-if="editMode.materials" 
      type="success" 
      size="small" 
      @click="toggleEditMode('materials')"
    >
      锁定编辑
    </el-button>
    <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
  </div>
</div>
```

### 3. 修改原料名称列模板
**文件：** `frontend/src/views/cost/CostAdd.vue`

添加 `from_standard` 判断，使其与包材保持一致：

```vue
<el-table-column label="原料名称" min-width="200">
  <template #default="{ row, $index }">
    <el-select
      v-if="!row.from_standard || editMode.materials"
      v-model="row.material_id"
      filterable
      clearable
      placeholder="输入关键词搜索原料"
      @change="onMaterialSelect(row, $index)"
      style="width: 100%"
    >
      <!-- 选项列表 -->
    </el-select>
    <span v-else>{{ row.item_name }}</span>
  </template>
</el-table-column>
```

### 4. 添加锁定状态下的禁用控制
**文件：** `frontend/src/views/cost/CostAdd.vue`

- 原料用量输入框添加 `:disabled="row.from_standard && !editMode.materials"`
- 原料删除按钮添加 `:disabled="row.from_standard && !editMode.materials"`

## 测试结果
✅ 编辑报价单时，原料、工序、包材明细都能正确显示名称
✅ 默认情况下显示为文本，不可编辑
✅ 点击"解锁编辑"按钮后，可以编辑这些数据
✅ 点击"锁定编辑"按钮后，恢复为只读状态

## 影响范围
- 编辑报价单功能
- 复制报价单功能
- 原料、工序、包材明细的显示和编辑

## 相关文件
- `frontend/src/views/cost/CostAdd.vue`
