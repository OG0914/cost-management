<template>
  <el-dialog v-model="visible" title="配置产品BOM" width="800px" :close-on-click-modal="false" @close="handleClose">
    <div class="bom-config">
      <!-- 添加原料区域 -->
      <div class="add-section">
        <el-select v-model="newMaterialId" filterable clearable placeholder="选择原料" style="width: 300px">
          <el-option v-for="m in availableMaterials" :key="m.id" :label="`${m.name} (${m.item_no})`" :value="m.id">
            <div style="display: flex; justify-content: space-between;">
              <span>{{ m.name }}</span>
              <span style="color: #909399; font-size: 12px;">¥{{ m.price }}/{{ m.unit }}</span>
            </div>
          </el-option>
        </el-select>
        <el-input-number v-model="newUsageAmount" :min="0.0001" :precision="4" :controls="false" placeholder="用量" style="width: 120px; margin-left: 10px" />
        <el-button type="primary" @click="handleAdd" :disabled="!newMaterialId || !newUsageAmount" style="margin-left: 10px">
          <el-icon><Plus /></el-icon>添加
        </el-button>
      </div>

      <!-- BOM列表 -->
      <el-table :data="bomList" border style="width: 100%; margin-top: 16px" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="item_no" label="料号" width="120" />
        <el-table-column prop="material_name" label="原料名称" min-width="180" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{ row }">{{ formatNumber(row.unit_price) }}</template>
        </el-table-column>
        <el-table-column label="用量" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.usage_amount" :min="0.0001" :precision="4" :controls="false" size="small" @change="handleUpdateUsage(row)" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="bomList.length === 0" class="empty-tip">暂无BOM数据，请添加原料</div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatNumber } from '../utils/format'

const props = defineProps({ modelId: { type: Number, default: null }, modelName: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'updated'])

const visible = defineModel({ type: Boolean, default: false })
const loading = ref(false)
const bomList = ref([])
const allMaterials = ref([])
const newMaterialId = ref(null)
const newUsageAmount = ref(null)

// 过滤已添加的原料
const availableMaterials = computed(() => {
  const usedIds = new Set(bomList.value.map(b => b.material_id))
  return allMaterials.value.filter(m => !usedIds.has(m.id))
})

// 监听弹窗打开
watch(visible, async (val) => {
  if (val && props.modelId) {
    await Promise.all([fetchBom(), fetchMaterials()])
  }
})

// 获取BOM列表
const fetchBom = async () => {
  loading.value = true
  try {
    const res = await request.get(`/bom/${props.modelId}`)
    if (res.success) bomList.value = res.data || []
  } catch (e) { ElMessage.error('获取BOM失败') }
  finally { loading.value = false }
}

// 获取所有原料
const fetchMaterials = async () => {
  try {
    const res = await request.get('/materials', { params: { pageSize: 9999 } })
    if (res.success) allMaterials.value = res.data || []
  } catch (e) { ElMessage.error('获取原料列表失败') }
}

// 添加原料到BOM
const handleAdd = async () => {
  if (!newMaterialId.value || !newUsageAmount.value) return
  loading.value = true
  try {
    const res = await request.post('/bom', { model_id: props.modelId, material_id: newMaterialId.value, usage_amount: newUsageAmount.value })
    if (res.success) {
      bomList.value = res.data || []
      newMaterialId.value = null
      newUsageAmount.value = null
      ElMessage.success('添加成功')
      emit('updated')
    }
  } catch (e) { /* 错误已在拦截器处理 */ }
  finally { loading.value = false }
}

// 更新用量
const handleUpdateUsage = async (row) => {
  if (row.usage_amount <= 0) { ElMessage.warning('用量必须大于0'); return }
  try {
    const res = await request.put(`/bom/${row.id}`, { usage_amount: row.usage_amount })
    if (res.success) { bomList.value = res.data || []; emit('updated') }
  } catch (e) { /* 错误已在拦截器处理 */ }
}

// 删除BOM原料
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除原料"${row.material_name}"吗？`, '提示', { type: 'warning' })
    const res = await request.delete(`/bom/${row.id}`)
    if (res.success) { bomList.value = res.data || []; ElMessage.success('删除成功'); emit('updated') }
  } catch (e) { if (e !== 'cancel') { /* 错误已在拦截器处理 */ } }
}

const handleClose = () => { bomList.value = []; newMaterialId.value = null; newUsageAmount.value = null }
</script>

<style scoped>
.bom-config { min-height: 300px; }
.add-section { display: flex; align-items: center; }
.empty-tip { text-align: center; color: #909399; padding: 40px 0; }
</style>
