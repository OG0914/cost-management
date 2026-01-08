<template>
  <div class="cost-detail-block">
    <div class="cost-detail-header">
      <span class="cost-detail-title">{{ title }}</span>
      <div class="cost-section-actions">
        <el-button 
          v-if="!editMode && hasStandardItems" 
          type="warning" 
          size="small" 
          @click="$emit('toggle-edit-mode')"
        >解锁编辑</el-button>
        <el-button 
          v-if="editMode" 
          type="success" 
          size="small" 
          @click="$emit('toggle-edit-mode')"
        >锁定编辑</el-button>
        <el-button type="primary" size="small" @click="$emit('add-row')">
          添加{{ itemLabel }}
        </el-button>
      </div>
    </div>

    <el-table :data="items" border size="small" class="w-full">
      <!-- 管销后复选框（仅原料类型显示） -->
      <el-table-column v-if="type === 'material'" width="50" align="center">
        <template #header>
          <el-tooltip content="勾选后，该原料将在管销价计算后再加入成本" placement="top">
            <span class="cursor-help text-xs">管销后</span>
          </el-tooltip>
        </template>
        <template #default="{ row }">
          <el-checkbox 
            v-model="row.after_overhead" 
            @change="$emit('calculate')" 
            :disabled="row.from_standard && !editMode" 
          />
        </template>
      </el-table-column>

      <!-- 名称列 -->
      <el-table-column :label="nameLabel" min-width="200">
        <template #default="{ row, $index }">
          <!-- 原料/包材：下拉搜索 -->
          <template v-if="type === 'material' || type === 'packaging'">
            <el-select 
              v-if="!row.from_standard || editMode" 
              v-model="row.material_id" 
              filterable 
              remote
              reserve-keyword
              clearable 
              :remote-method="searchMaterials"
              :loading="searchLoading"
              placeholder="输入名称或料号搜索" 
              @change="onItemSelect(row, $index)" 
              style="width: 100%"
            >
              <el-option v-for="m in searchOptions" :key="m.id" :label="`${m.name} (${m.item_no})`" :value="m.id">
                <div class="flex justify-between w-full">
                  <span>{{ m.name }}</span>
                  <span class="text-slate-400 text-xs">¥{{ m.price }}/{{ m.unit }}</span>
                </div>
              </el-option>
            </el-select>
            <span v-else class="text-sm">{{ row.item_name }}</span>
          </template>
          <!-- 工序：文本输入 -->
          <template v-else>
            <el-input 
              v-model="row.item_name" 
              @change="$emit('calculate-item', row)" 
              :disabled="row.from_standard && !editMode" 
            />
          </template>
        </template>
      </el-table-column>

      <!-- 基本用量 -->
      <el-table-column label="基本用量" width="100">
        <template #default="{ row }">
          <el-input-number 
            v-model="row.usage_amount" 
            :min="0" 
            :precision="4" 
            :controls="false" 
            @change="$emit('calculate-item', row)" 
            size="small" 
            style="width: 100%" 
            :disabled="row.from_standard && !editMode" 
          />
        </template>
      </el-table-column>

      <!-- 单价（工序可编辑，原料/包材只读） -->
      <el-table-column :label="priceLabel" width="100">
        <template #default="{ row }">
          <template v-if="type === 'process'">
            <el-input-number 
              v-model="row.unit_price" 
              :min="0" 
              :precision="4" 
              :controls="false" 
              @change="$emit('calculate-item', row)" 
              size="small" 
              style="width: 100%" 
              :disabled="row.from_standard && !editMode" 
            />
          </template>
          <template v-else>
            {{ formatNumber(row.unit_price) || '-' }}
          </template>
        </template>
      </el-table-column>

      <!-- 小计 -->
      <el-table-column label="小计" width="100">
        <template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="70" fixed="right">
        <template #default="{ $index, row }">
          <el-button 
            type="danger" 
            size="small" 
            link 
            @click="$emit('remove-row', $index)" 
            :disabled="row.from_standard && !editMode"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 小计行 -->
    <div class="cost-detail-subtotal">
      <slot name="subtotal"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatNumber } from '@/utils/format'
import request from '@/utils/request'
import logger from '@/utils/logger'

const props = defineProps({
  type: { type: String, required: true, validator: (v) => ['material', 'process', 'packaging'].includes(v) },
  title: { type: String, required: true },
  items: { type: Array, required: true },
  editMode: { type: Boolean, default: false }
})

defineEmits(['toggle-edit-mode', 'add-row', 'remove-row', 'calculate', 'calculate-item', 'item-select'])

const searchLoading = ref(false)
const searchOptions = ref([])

const itemLabel = computed(() => {
  const map = { material: '原料', process: '工序', packaging: '包材' }
  return map[props.type] || '项目'
})

const nameLabel = computed(() => {
  const map = { material: '原料名称', process: '工序名称', packaging: '包材名称' }
  return map[props.type] || '名称'
})

const priceLabel = computed(() => {
  return props.type === 'process' ? '工价(CNY)' : '单价(CNY)'
})

const hasStandardItems = computed(() => {
  return props.items.some(item => item.from_standard)
})

const searchMaterials = async (query) => {
  if (!query || query.length < 1) {
    searchOptions.value = []
    return
  }
  searchLoading.value = true
  try {
    const res = await request.get('/materials/search', { params: { keyword: query, limit: 30 } })
    if (res.success) {
      searchOptions.value = res.data || []
    }
  } catch (err) {
    logger.error('搜索物料失败:', err)
  } finally {
    searchLoading.value = false
  }
}

const onItemSelect = (row, index) => {
  const selected = searchOptions.value.find(m => m.id === row.material_id)
  if (selected) {
    row.item_name = selected.name
    row.item_no = selected.item_no
    row.unit_price = selected.price
    row.unit = selected.unit
  }
  emit('calculate-item', row)
  emit('item-select', { row, index, selected })
}
</script>
