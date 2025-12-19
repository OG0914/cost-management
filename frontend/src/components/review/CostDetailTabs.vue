<template>
  <div class="cost-detail-tabs">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="原料" name="material">
        <div class="tab-content">
          <el-table :data="materialItems" border size="small" class="detail-table">
            <el-table-column prop="item_name" label="原料名称" min-width="120">
              <template #default="{ row }">
                <div class="item-name" :class="getDiffClass(row)">
                  {{ row.item_name }}
                  <span class="diff-badge" v-if="row.diff_status !== 'unchanged'">
                    {{ getDiffBadge(row.diff_status) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="usage_amount" label="用量" width="100" align="right">
              <template #default="{ row }">
                <template v-if="editable && row.diff_status !== 'deleted'">
                  <el-input-number 
                    v-model="row.usage_amount" 
                    :precision="4" 
                    :step="0.001"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="handleItemChange(row)"
                  />
                </template>
                <template v-else>
                  {{ row.usage_amount?.toFixed(4) || '-' }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="unit_price" label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.unit_price?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100" align="right">
              <template #default="{ row }">
                {{ calculateSubtotal(row) }}
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="标准值" width="100" align="right">
              <template #default="{ row }">
                <template v-if="row.standard_subtotal !== undefined">
                  {{ row.standard_subtotal?.toFixed(4) || '-' }}
                  <div class="diff-value" v-if="row.diff_amount">
                    ({{ row.diff_amount > 0 ? '+' : '' }}{{ row.diff_amount.toFixed(4) }})
                  </div>
                </template>
                <template v-else>-</template>
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="状态" width="80" align="center">
              <template #default="{ row }">
                <span class="status-tag" :class="getDiffClass(row)">
                  {{ getDiffStatusText(row.diff_status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column v-if="editable" label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="tab-footer">
            <span class="subtotal-label">原料小计: {{ materialSubtotal.toFixed(4) }} 元</span>
            <span v-if="showDiff && materialStandardSubtotal > 0" class="standard-subtotal">
              标准小计: {{ materialStandardSubtotal.toFixed(4) }} 元
              <span class="diff-total" :class="materialDiffClass">
                差异: {{ materialDiff > 0 ? '+' : '' }}{{ materialDiff.toFixed(4) }} 元
              </span>
            </span>
            <el-button v-if="editable" type="primary" link @click="handleAdd('material')">
              + 添加原料
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="工序" name="process">
        <div class="tab-content">
          <el-table :data="processItems" border size="small" class="detail-table">
            <el-table-column prop="item_name" label="工序名称" min-width="120">
              <template #default="{ row }">
                <div class="item-name" :class="getDiffClass(row)">
                  {{ row.item_name }}
                  <span class="diff-badge" v-if="row.diff_status !== 'unchanged'">
                    {{ getDiffBadge(row.diff_status) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="usage_amount" label="用量" width="100" align="right">
              <template #default="{ row }">
                <template v-if="editable && row.diff_status !== 'deleted'">
                  <el-input-number 
                    v-model="row.usage_amount" 
                    :precision="4" 
                    :step="0.001"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="handleItemChange(row)"
                  />
                </template>
                <template v-else>
                  {{ row.usage_amount?.toFixed(4) || '-' }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="unit_price" label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.unit_price?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100" align="right">
              <template #default="{ row }">
                {{ calculateSubtotal(row) }}
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="标准值" width="100" align="right">
              <template #default="{ row }">
                <template v-if="row.standard_subtotal !== undefined">
                  {{ row.standard_subtotal?.toFixed(4) || '-' }}
                  <div class="diff-value" v-if="row.diff_amount">
                    ({{ row.diff_amount > 0 ? '+' : '' }}{{ row.diff_amount.toFixed(4) }})
                  </div>
                </template>
                <template v-else>-</template>
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="状态" width="80" align="center">
              <template #default="{ row }">
                <span class="status-tag" :class="getDiffClass(row)">
                  {{ getDiffStatusText(row.diff_status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column v-if="editable" label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="tab-footer">
            <span class="subtotal-label">工序小计: {{ processSubtotal.toFixed(4) }} 元</span>
            <span v-if="showDiff && processStandardSubtotal > 0" class="standard-subtotal">
              标准小计: {{ processStandardSubtotal.toFixed(4) }} 元
              <span class="diff-total" :class="processDiffClass">
                差异: {{ processDiff > 0 ? '+' : '' }}{{ processDiff.toFixed(4) }} 元
              </span>
            </span>
            <el-button v-if="editable" type="primary" link @click="handleAdd('process')">
              + 添加工序
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="包材" name="packaging">
        <div class="tab-content">
          <el-table :data="packagingItems" border size="small" class="detail-table">
            <el-table-column prop="item_name" label="包材名称" min-width="120">
              <template #default="{ row }">
                <div class="item-name" :class="getDiffClass(row)">
                  {{ row.item_name }}
                  <span class="diff-badge" v-if="row.diff_status !== 'unchanged'">
                    {{ getDiffBadge(row.diff_status) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="usage_amount" label="用量" width="100" align="right">
              <template #default="{ row }">
                <template v-if="editable && row.diff_status !== 'deleted'">
                  <el-input-number 
                    v-model="row.usage_amount" 
                    :precision="4" 
                    :step="0.001"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="handleItemChange(row)"
                  />
                </template>
                <template v-else>
                  {{ row.usage_amount?.toFixed(4) || '-' }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="unit_price" label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.unit_price?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100" align="right">
              <template #default="{ row }">
                {{ calculateSubtotal(row) }}
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="标准值" width="100" align="right">
              <template #default="{ row }">
                <template v-if="row.standard_subtotal !== undefined">
                  {{ row.standard_subtotal?.toFixed(4) || '-' }}
                  <div class="diff-value" v-if="row.diff_amount">
                    ({{ row.diff_amount > 0 ? '+' : '' }}{{ row.diff_amount.toFixed(4) }})
                  </div>
                </template>
                <template v-else>-</template>
              </template>
            </el-table-column>
            <el-table-column v-if="showDiff" label="状态" width="80" align="center">
              <template #default="{ row }">
                <span class="status-tag" :class="getDiffClass(row)">
                  {{ getDiffStatusText(row.diff_status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column v-if="editable" label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="tab-footer">
            <span class="subtotal-label">包材小计: {{ packagingSubtotal.toFixed(4) }} 元</span>
            <span v-if="showDiff && packagingStandardSubtotal > 0" class="standard-subtotal">
              标准小计: {{ packagingStandardSubtotal.toFixed(4) }} 元
              <span class="diff-total" :class="packagingDiffClass">
                差异: {{ packagingDiff > 0 ? '+' : '' }}{{ packagingDiff.toFixed(4) }} 元
              </span>
            </span>
            <el-button v-if="editable" type="primary" link @click="handleAdd('packaging')">
              + 添加包材
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateDiffStatus } from '@/utils/review'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  standardItems: {
    type: Array,
    default: () => []
  },
  showDiff: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['item-change', 'item-add', 'item-delete'])

const activeTab = ref('material')

// 按类别过滤并计算差异
const processItemsWithDiff = (category) => {
  const categoryItems = props.items.filter(item => item.category === category)
  const standardCategoryItems = props.standardItems.filter(item => item.category === category)
  
  return categoryItems.map(item => {
    const diffStatus = calculateDiffStatus(item, standardCategoryItems)
    const standardItem = standardCategoryItems.find(
      s => s.item_name === item.item_name
    )
    const standardSubtotal = standardItem 
      ? parseFloat(standardItem.usage_amount) * parseFloat(standardItem.unit_price)
      : undefined
    const currentSubtotal = parseFloat(item.usage_amount) * parseFloat(item.unit_price)
    const diffAmount = standardSubtotal !== undefined 
      ? currentSubtotal - standardSubtotal 
      : undefined
    
    return {
      ...item,
      diff_status: diffStatus,
      standard_subtotal: standardSubtotal,
      diff_amount: diffAmount
    }
  })
}

// 各类别数据
const materialItems = computed(() => processItemsWithDiff('material'))
const processItems = computed(() => processItemsWithDiff('process'))
const packagingItems = computed(() => processItemsWithDiff('packaging'))

// 小计计算
const calculateCategorySubtotal = (items) => {
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.usage_amount) || 0) * (parseFloat(item.unit_price) || 0)
  }, 0)
}

const calculateStandardSubtotal = (category) => {
  const items = props.standardItems.filter(item => item.category === category)
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.usage_amount) || 0) * (parseFloat(item.unit_price) || 0)
  }, 0)
}

const materialSubtotal = computed(() => calculateCategorySubtotal(materialItems.value))
const processSubtotal = computed(() => calculateCategorySubtotal(processItems.value))
const packagingSubtotal = computed(() => calculateCategorySubtotal(packagingItems.value))

const materialStandardSubtotal = computed(() => calculateStandardSubtotal('material'))
const processStandardSubtotal = computed(() => calculateStandardSubtotal('process'))
const packagingStandardSubtotal = computed(() => calculateStandardSubtotal('packaging'))

const materialDiff = computed(() => materialSubtotal.value - materialStandardSubtotal.value)
const processDiff = computed(() => processSubtotal.value - processStandardSubtotal.value)
const packagingDiff = computed(() => packagingSubtotal.value - packagingStandardSubtotal.value)

const materialDiffClass = computed(() => materialDiff.value > 0 ? 'diff-positive' : materialDiff.value < 0 ? 'diff-negative' : '')
const processDiffClass = computed(() => processDiff.value > 0 ? 'diff-positive' : processDiff.value < 0 ? 'diff-negative' : '')
const packagingDiffClass = computed(() => packagingDiff.value > 0 ? 'diff-positive' : packagingDiff.value < 0 ? 'diff-negative' : '')

// 计算小计
const calculateSubtotal = (row) => {
  const subtotal = (parseFloat(row.usage_amount) || 0) * (parseFloat(row.unit_price) || 0)
  return subtotal.toFixed(4)
}

// 差异状态相关
const getDiffClass = (row) => {
  const status = row.diff_status || 'unchanged'
  return `diff-${status}`
}

const getDiffBadge = (status) => {
  const badges = {
    modified: '⚠',
    added: '➕',
    deleted: '➖'
  }
  return badges[status] || ''
}

const getDiffStatusText = (status) => {
  const texts = {
    unchanged: '✓ 一致',
    modified: '⚠ 修改',
    added: '➕ 新增',
    deleted: '➖ 删除'
  }
  return texts[status] || status
}

// 事件处理
const handleItemChange = (item) => {
  emit('item-change', item)
}

const handleAdd = (category) => {
  emit('item-add', category)
}

const handleDelete = (item) => {
  emit('item-delete', item.id)
}
</script>

<style scoped>
.cost-detail-tabs {
  width: 100%;
}

.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.detail-tabs :deep(.el-tabs__item) {
  font-size: 14px;
}

.tab-content {
  width: 100%;
}

.detail-table {
  width: 100%;
}

.detail-table :deep(.el-table__row) {
  transition: background-color 0.2s;
}

/* 差异高亮行样式 */
.detail-table :deep(.el-table__row.diff-modified) {
  background-color: #E6F7FF;
}

.detail-table :deep(.el-table__row.diff-added) {
  background-color: #F6FFED;
}

.detail-table :deep(.el-table__row.diff-deleted) {
  background-color: #FFF1F0;
}

.item-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.diff-badge {
  font-size: 12px;
}

.diff-value {
  font-size: 11px;
  color: #909399;
}

/* 状态标签 */
.status-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-tag.diff-unchanged {
  color: #67c23a;
}

.status-tag.diff-modified {
  color: #1890FF;
  background: #E6F7FF;
}

.status-tag.diff-added {
  color: #52C41A;
  background: #F6FFED;
}

.status-tag.diff-deleted {
  color: #FF4D4F;
  background: #FFF1F0;
}

/* 底部汇总 */
.tab-footer {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.subtotal-label {
  font-weight: 600;
  color: #303133;
}

.standard-subtotal {
  color: #606266;
}

.diff-total {
  margin-left: 8px;
}

.diff-total.diff-positive {
  color: #f56c6c;
}

.diff-total.diff-negative {
  color: #67c23a;
}

/* 输入框样式 */
.detail-table :deep(.el-input-number) {
  width: 90px;
}

.detail-table :deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
