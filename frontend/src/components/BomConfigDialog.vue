<template>
  <el-dialog 
    v-model="visible" 
    :title="dialogTitle" 
    width="850px" 
    top="5vh" 
    class="minimal-dialog"
    append-to-body 
    :close-on-click-modal="false" 
    @close="handleClose"
  >
    <div class="bom-config">
      <!-- 操作区域 -->
      <div class="action-section">
        <!-- 添加原料 -->
        <div class="add-section">
          <el-select 
            v-model="newMaterialId" 
            filterable 
            remote 
            reserve-keyword
            clearable 
            :remote-method="searchMaterials"
            :loading="materialSearchLoading"
            placeholder="输入名称或料号搜索原料" 
            style="width: 280px"
          >
            <el-option v-for="m in filteredMaterialOptions" :key="m.id" :label="`${m.name} (${m.item_no})`" :value="m.id">
              <div style="display: flex; justify-content: space-between;">
                <span>{{ m.name }}</span>
                <span style="color: #909399; font-size: 12px;">¥{{ m.price }}/{{ m.unit }}</span>
              </div>
            </el-option>
          </el-select>
          <el-input-number v-model="newUsageAmount" :min="0.0001" :precision="4" :controls="false" placeholder="用量" style="width: 100px; margin-left: 10px" />
          <el-button type="primary" @click="handleAdd" :disabled="!newMaterialId || !newUsageAmount" style="margin-left: 10px">
            <el-icon><Plus /></el-icon>添加
          </el-button>
        </div>
        <!-- 批量操作 -->
        <el-space>
          <el-upload action="#" :auto-upload="false" :on-change="handleImportFile" :show-file-list="false" accept=".xlsx,.xls">
            <el-button type="warning" plain :icon="Upload">导入BOM</el-button>
          </el-upload>
          <el-button type="success" plain @click="showCopyDialog = true" :icon="CopyDocument">一键复制</el-button>
        </el-space>
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

      <div v-if="bomList.length === 0" class="empty-tip">暂无BOM数据，请添加原料或从其他型号复制</div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 一键复制弹窗 -->
  <el-dialog 
    v-model="showCopyDialog" 
    title="从其他型号复制BOM" 
    width="500px" 
    class="minimal-dialog-auto"
    append-to-body 
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="源型号" required>
        <el-select v-model="copySourceId" filterable placeholder="选择要复制的源型号" style="width: 100%" @change="handleSourceChange" :loading="modelsLoading">
          <template #empty>
            <div style="padding: 10px; text-align: center; color: #909399;">{{ modelsLoading ? '加载中...' : '暂无已配置BOM的型号' }}</div>
          </template>
          <el-option v-for="m in modelsWithBom" :key="m.id" :label="m.model_name" :value="m.id">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ m.model_name }}</span>
              <div>
                <el-tag size="small" type="info" style="margin-right: 4px">{{ m.regulation_name }}</el-tag>
                <el-tag size="small" type="success">{{ m.bom_count }}项</el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="源BOM预览" v-if="sourceBomPreview.length > 0">
        <div class="source-preview">
          <el-tag v-for="item in sourceBomPreview.slice(0, 5)" :key="item.material_id" size="small" style="margin: 2px">
            {{ item.material_name }}
          </el-tag>
          <el-tag v-if="sourceBomPreview.length > 5" size="small" type="info">+{{ sourceBomPreview.length - 5 }}项</el-tag>
        </div>
      </el-form-item>
      <el-form-item label="复制模式">
        <el-radio-group v-model="copyMode">
          <el-radio value="replace">
            <span>替换模式</span>
            <el-text type="info" size="small" style="margin-left: 4px">清空现有BOM后复制</el-text>
          </el-radio>
          <el-radio value="merge">
            <span>合并模式</span>
            <el-text type="info" size="small" style="margin-left: 4px">保留现有，跳过重复</el-text>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCopyDialog = false">取消</el-button>
      <el-button type="primary" @click="handleCopy" :loading="copyLoading" :disabled="!copySourceId">确认复制</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CopyDocument, Upload } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatNumber } from '../utils/format'

const props = defineProps({ 
  modelId: { type: Number, default: null }, 
  modelName: { type: String, default: '' },
  regulationName: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const visible = defineModel({ type: Boolean, default: false })
const loading = ref(false)
const bomList = ref([])
const materialOptions = ref([])
const materialSearchLoading = ref(false)
const newMaterialId = ref(null)
const newUsageAmount = ref(null)

const showCopyDialog = ref(false)
const copySourceId = ref(null)
const copyMode = ref('replace')
const copyLoading = ref(false)
const allModels = ref([])
const modelsLoading = ref(false)
const sourceBomPreview = ref([])

// 弹窗标题（显示型号和法规）
const dialogTitle = computed(() => {
  const parts = ['配置产品BOM']
  if (props.modelName) parts.push(`【${props.modelName}】`)
  if (props.regulationName) parts.push(`- ${props.regulationName}`)
  return parts.join(' ')
})

// 过滤已添加的原料（从搜索结果中排除）
const filteredMaterialOptions = computed(() => {
  const usedIds = new Set(bomList.value.map(b => b.material_id))
  return materialOptions.value.filter(m => !usedIds.has(m.id))
})

// 过滤有BOM的型号（排除当前型号）
const modelsWithBom = computed(() => allModels.value.filter(m => m.id !== props.modelId && m.bom_count > 0))

// 监听弹窗打开
watch(visible, async (val) => {
  if (val && props.modelId) {
    await Promise.all([fetchBom(), fetchModels()])
    materialOptions.value = []
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

// 远程搜索原料
const searchMaterials = async (query) => {
  if (!query || query.length < 1) {
    materialOptions.value = []
    return
  }
  materialSearchLoading.value = true
  try {
    const res = await request.get('/materials', { params: { keyword: query, pageSize: 50 } })
    if (res.success) materialOptions.value = res.data || []
  } catch (e) { materialOptions.value = [] }
  finally { materialSearchLoading.value = false }
}

// 获取所有型号（带BOM数量，用于复制选择）
const fetchModels = async () => {
  modelsLoading.value = true
  try {
    const res = await request.get('/models/with-bom-count')
    if (res.success) allModels.value = res.data || []
    else { // 回退到普通接口
      const fallback = await request.get('/models')
      if (fallback.success) allModels.value = (fallback.data || []).map(m => ({ ...m, bom_count: 0 }))
    }
  } catch (e) { /* 静默处理 */ }
  finally { modelsLoading.value = false }
}

// 选择源型号时预览其BOM
const handleSourceChange = async (sourceId) => {
  if (!sourceId) { sourceBomPreview.value = []; return }
  try {
    const res = await request.get(`/bom/${sourceId}`)
    sourceBomPreview.value = res.success ? (res.data || []) : []
  } catch (e) { sourceBomPreview.value = [] }
}

// 执行复制
const handleCopy = async () => {
  if (!copySourceId.value) return
  const sourceModel = allModels.value.find(m => m.id === copySourceId.value)
  const modeText = copyMode.value === 'replace' ? '替换' : '合并'
  
  try {
    await ElMessageBox.confirm(
      `确定要${modeText}复制「${sourceModel?.model_name}」的BOM到当前型号吗？${copyMode.value === 'replace' ? '\n⚠️ 这将清空当前BOM！' : ''}`,
      '确认复制', { type: 'warning' }
    )
    copyLoading.value = true
    const res = await request.post('/bom/copy', { source_model_id: copySourceId.value, target_model_id: props.modelId, mode: copyMode.value })
    if (res.success) {
      bomList.value = res.data.bom || []
      ElMessage.success(res.message || '复制成功')
      showCopyDialog.value = false
      copySourceId.value = null
      sourceBomPreview.value = []
      emit('updated')
    }
  } catch (e) { if (e !== 'cancel') { /* 错误已在拦截器处理 */ } }
  finally { copyLoading.value = false }
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

// 导入BOM Excel
const handleImportFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file.raw)
  formData.append('model_id', props.modelId)
  formData.append('mode', 'replace')
  
  try {
    await ElMessageBox.confirm('导入将替换当前BOM，是否继续？', '确认导入', { type: 'warning' })
    loading.value = true
    const res = await request.post('/bom/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.success) {
      bomList.value = res.data.bom || []
      const { created, updated, skipped } = res.data
      ElMessage.success(`导入成功：新增${created}项，更新${updated}项${skipped > 0 ? `，跳过${skipped}项（原料不存在）` : ''}`)
      emit('updated')
    }
  } catch (e) { if (e !== 'cancel') { /* 错误已在拦截器处理 */ } }
  finally { loading.value = false }
}

const handleClose = () => { bomList.value = []; newMaterialId.value = null; newUsageAmount.value = null; copySourceId.value = null; sourceBomPreview.value = [] }
</script>

<style scoped>
.bom-config { min-height: 300px; }
.action-section { display: flex; align-items: center; justify-content: space-between; }
.add-section { display: flex; align-items: center; }
.empty-tip { text-align: center; color: #909399; padding: 40px 0; }
.source-preview { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: #f5f7fa; border-radius: 4px; }
</style>
