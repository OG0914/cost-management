<template>
  <div class="model-manage">
    <PageHeader title="型号管理">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && authStore.isAdmin">
              <ActionButton type="download" @click="handleDownloadTemplate">下载模板</ActionButton>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <ActionButton type="import">导入Excel</ActionButton>
              </el-upload>
              <ActionButton type="export" @click="handleExport">导出Excel</ActionButton>
              <ActionButton type="delete" :disabled="selectedModels.length === 0" @click="handleBatchDelete">批量删除</ActionButton>
              <ActionButton type="add" @click="handleAdd">新增型号</ActionButton>
            </el-space>
          </transition>
        </div>
      </template>
    </PageHeader>

    <el-card>
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-input v-model="searchKeyword" placeholder="搜索型号名称、法规类别..." :prefix-icon="Search" clearable @input="handleSearch" style="width: 250px" />
        <el-button-group class="view-toggle">
          <el-button :type="viewMode === 'card' ? 'primary' : 'default'" :icon="Grid" @click="viewMode = 'card'" />
          <el-button :type="viewMode === 'list' ? 'primary' : 'default'" :icon="List" @click="viewMode = 'list'" />
        </el-button-group>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="item-cards">
        <div v-if="paginatedModels.length === 0" class="empty-tip">暂无匹配数据</div>
        <div v-for="item in paginatedModels" :key="item.id" class="item-card">
          <div class="card-body">
            <div class="item-header">
              <div class="avatar" :style="{ backgroundColor: getRegulationColor(item.regulation_name) }">
                {{ item.model_category || item.model_series || '?' }}
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.model_name }}</div>
                <div class="item-sub">{{ item.regulation_name }}</div>
              </div>
            </div>
            <div class="item-details">
              <div class="series-tag" v-if="item.model_series">
                <span class="label">系列:</span> {{ item.model_series }}
              </div>
              <div class="bom-info cursor-pointer hover:text-blue-600 transition-colors" @click="handleConfigBom(item)">
                BOM: 共 {{ item.bom_count || 0 }} 项
              </div>
              <div class="status">
                <span :class="item.is_active ? 'status-active' : 'status-inactive'"></span>
                {{ item.is_active ? '已启用' : '已禁用' }}
              </div>
            </div>
          </div>
          <div class="card-actions" v-if="authStore.isAdmin">
            <el-button :icon="Setting" circle @click="handleConfigBom(item)" title="配置BOM" />
            <el-button :icon="EditPen" circle @click="handleEdit(item)" title="编辑" />
            <el-button :icon="Delete" circle class="delete-btn" @click="handleDelete(item)" title="删除" />
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <el-table v-if="viewMode === 'list'" :data="paginatedModels" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="regulation_name" label="法规类别" width="120" sortable />
        <el-table-column prop="model_name" label="型号名称" sortable />
        <el-table-column prop="model_series" label="产品系列" width="140" sortable>
         
        </el-table-column>
        <el-table-column prop="model_category" label="型号分类" width="140" sortable />
        <el-table-column label="BOM明细" width="120" align="center">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleConfigBom(row)">
              <span class="font-bold">共 {{ row.bom_count || 0 }} 项</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="120" align="center">
          <template #default="{ row }">
            <div class="status">
              <span :class="row.is_active ? 'status-active' : 'status-inactive'"></span>
              {{ row.is_active ? '已启用' : '已禁用' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" v-if="authStore.isAdmin">
          <template #default="{ row }">
            <el-button :icon="Setting" circle size="small" @click="handleConfigBom(row)" title="配置BOM" />
            <el-button :icon="EditPen" circle size="small" @click="handleEdit(row)" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <CommonPagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredModels.length" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px" 
      class="minimal-dialog-auto" 
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="法规类别" required>
          <el-select v-model="form.regulation_id" filterable placeholder="请选择法规类别" style="width: 100%">
            <el-option v-for="reg in regulations" :key="reg.id" :label="reg.name" :value="reg.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号名称" required>
          <el-input v-model="form.model_name" placeholder="请输入型号名称" />
        </el-form-item>
        <el-form-item label="产品系列">
          <el-autocomplete
            v-model="form.model_series"
            :fetch-suggestions="querySearchSeries"
            placeholder="请输入产品系列（如：MK81）"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="型号分类">
          <el-input v-model="form.model_category" placeholder="请输入型号分类（如：口罩、半面罩）" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <StatusSwitch v-model="form.is_active" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- BOM配置弹窗 -->
    <BomConfigDialog v-model="bomDialogVisible" :model-id="currentBomModelId" :model-name="currentBomModelName" :regulation-name="currentBomRegulationName" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, Download, Delete, EditPen, Grid, List, CaretLeft, CaretRight, Setting } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { formatDateTime } from '@/utils/format'
import logger from '@/utils/logger'
import PageHeader from '@/components/common/PageHeader.vue'
import CommonPagination from '@/components/common/CommonPagination.vue'
import BomConfigDialog from '@/components/BomConfigDialog.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'

const authStore = useAuthStore()
const showToolbar = ref(false)
const models = ref([])
const seriesList = ref([]) // 所有产品系列列表
const bomDialogVisible = ref(false)
const currentBomModelId = ref(null)
const currentBomModelName = ref('')
const currentBomRegulationName = ref('')
const filteredModels = ref([])
const selectedModels = ref([])
const regulations = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增型号')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const viewMode = ref('card')
const currentPage = ref(1)
const pageSize = ref(12)

const paginatedModels = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredModels.value.slice(start, start + pageSize.value)
})

watch(viewMode, (newMode) => { if (newMode === 'card') selectedModels.value = [] })

const form = reactive({ id: null, regulation_id: null, model_name: '', model_category: '', model_series: '', is_active: 1 })

// 法规颜色映射（底色关联法规类别）
const REGULATION_COLORS = { 'NIOSH': '#409EFF', 'GB': '#67C23A', 'CE': '#E6A23C', 'ASNZS': '#F56C6C', 'KN': '#9B59B6' }
const getRegulationColor = (name) => REGULATION_COLORS[name] || '#909399'

const fetchRegulations = async () => {
  try {
    const response = await request.get('/regulations/active')
    if (response.success) regulations.value = response.data
  } catch (error) { ElMessage.error('获取法规列表失败') }
}

const fetchSeries = async () => {
  try {
    const response = await request.get('/models/series')
    if (response.success) seriesList.value = response.data.map(item => ({ value: item }))
  } catch (error) { logger.error('获取产品系列失败', error) }
}

const querySearchSeries = (queryString, cb) => {
  const results = queryString
    ? seriesList.value.filter(item => item.value.toLowerCase().includes(queryString.toLowerCase()))
    : seriesList.value
  cb(results)
}

const fetchModels = async () => {
  try {
    const response = await request.get('/models')
    if (response.success) { models.value = response.data; handleSearch() }
  } catch (error) { ElMessage.error('获取型号列表失败') }
}

const handleSearch = () => {
  if (!searchKeyword.value) { filteredModels.value = models.value; return }
  const keyword = searchKeyword.value.toLowerCase()
  filteredModels.value = models.value.filter(item => 
    item.model_name.toLowerCase().includes(keyword) || 
    (item.regulation_name && item.regulation_name.toLowerCase().includes(keyword)) ||
    (item.model_series && item.model_series.toLowerCase().includes(keyword))
  )
}

const handleAdd = () => {
  isEdit.value = false; dialogTitle.value = '新增型号'
  form.id = null; form.regulation_id = null; form.model_name = ''; form.model_category = ''; form.model_series = ''; form.is_active = 1
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true; dialogTitle.value = '编辑型号'
  form.id = row.id; form.regulation_id = row.regulation_id; form.model_name = row.model_name; form.model_category = row.model_category; form.model_series = row.model_series || ''; form.is_active = row.is_active
  dialogVisible.value = true
}

// 配置BOM
const handleConfigBom = (row) => {
  currentBomModelId.value = row.id
  currentBomModelName.value = row.model_name
  currentBomRegulationName.value = row.regulation_name || ''
  bomDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.regulation_id) { ElMessage.warning('请选择法规类别'); return }
  if (!form.model_name) { ElMessage.warning('请输入型号名称'); return }
  loading.value = true
  try {
    if (isEdit.value) { await request.put(`/models/${form.id}`, form); ElMessage.success('更新成功') }
    else { await request.post('/models', form); ElMessage.success('创建成功') }
    dialogVisible.value = false; fetchModels(); fetchSeries()
  } catch (error) { /* 错误已在拦截器处理 */ }
  finally { loading.value = false }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除型号"${row.model_name}"吗？`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await request.delete(`/models/${row.id}`)
    ElMessage.success('删除成功'); fetchModels()
  } catch (error) { if (error !== 'cancel') { /* 错误已在拦截器处理 */ } }
}

const handleBatchDelete = async () => {
  if (selectedModels.value.length === 0) { ElMessage.warning('请先选择要删除的型号'); return }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedModels.value.length} 条型号吗？`, '批量删除确认', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' })
    const ids = selectedModels.value.map(item => item.id)
    let successCount = 0, failCount = 0
    for (const id of ids) { try { await request.delete(`/models/${id}`); successCount++ } catch { failCount++ } }
    if (successCount > 0) { ElMessage.success(`成功删除 ${successCount} 条型号${failCount > 0 ? `，失败 ${failCount} 条` : ''}`); fetchModels() }
    else ElMessage.error('删除失败')
  } catch (error) { if (error !== 'cancel') { /* 错误已在拦截器处理 */ } }
}

const handleSelectionChange = (selection) => { selectedModels.value = selection }

const handleFileChange = async (file) => {
  const formData = new FormData(); formData.append('file', file.raw)
  try {
    const response = await request.post('/models/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (response.success) {
      const { created, updated, errors } = response.data
      let message = `导入成功！创建 ${created} 条，更新 ${updated} 条`
      if (errors?.length > 0) { message += `\n${errors.slice(0, 3).join('\n')}`; if (errors.length > 3) message += `\n...还有 ${errors.length - 3} 条错误` }
      ElMessage.success(message); fetchModels()
    }
  } catch (error) { /* 错误已在拦截器处理 */ }
}

const handleExport = async () => {
  if (selectedModels.value.length === 0) { ElMessage.warning('请先选择要导出的数据'); return }
  try {
    const ids = selectedModels.value.map(item => item.id)
    const response = await request.post('/models/export/excel', { ids }, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', `型号清单_${Date.now()}.xlsx`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    ElMessage.success('导出成功')
  } catch (error) { ElMessage.error('导出失败') }
}

const handleDownloadTemplate = async () => {
  try {
    const response = await request.get('/models/template/download', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', '型号导入模板.xlsx')
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    ElMessage.success('下载成功')
  } catch (error) { ElMessage.error('下载失败') }
}

onMounted(() => { fetchRegulations(); fetchModels(); fetchSeries() })
</script>

<style scoped>
.filter-section { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.filter-section .view-toggle { margin-left: auto; }

/* 卡片视图样式 */
.item-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1199px) { .item-cards { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 991px) { .item-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 767px) { .item-cards { grid-template-columns: 1fr; } }

.empty-tip { grid-column: 1 / -1; text-align: center; color: #909399; padding: 40px 0; }
.item-card { border: 1px solid #ebeef5; border-radius: 8px; background: #fff; transition: box-shadow 0.3s, border-color 0.3s; }
.item-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.item-card .card-body { padding: 16px; }

.item-header { display: flex; gap: 12px; margin-bottom: 16px; }
.avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600; flex-shrink: 0; transition: transform 0.2s; }
.item-card:hover .avatar { transform: scale(1.05); }

.item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.item-name { font-size: 16px; font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-sub { font-size: 13px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.item-details { display: flex; flex-direction: column; gap: 8px; }
.category { font-size: 14px; }
.category .el-tag { font-size: 13px; padding: 4px 10px; }
.no-category { color: #c0c4cc; font-size: 13px; }
.status { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; }
.status-active { width: 8px; height: 8px; border-radius: 50%; background-color: #67c23a; }
.status-inactive { width: 8px; height: 8px; border-radius: 50%; background-color: #909399; }
.bom-info { font-size: 13px; color: #606266; display: flex; align-items: center; }
.series-tag { font-size: 13px; color: #606266; display: flex; align-items: center; gap: 4px; }
.series-tag .label { color: #909399; }

.card-actions { display: flex; justify-content: center; gap: 8px; padding: 12px; border-top: 1px solid #ebeef5; background: #fafafa; border-radius: 0 0 8px 8px; }
.card-actions .el-button { transition: transform 0.2s, box-shadow 0.2s; }
.card-actions .el-button:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }

.delete-btn { color: #F56C6C; }
.delete-btn:hover:not(:disabled) { color: #f78989; border-color: #f78989; }

/* 工具栏折叠 */
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }
</style>


