<template>
  <div class="model-manage">
    <PageHeader title="型号管理">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && authStore.isAdmin">
          <el-button type="success" @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
            <el-button type="warning">
              <el-icon><Upload /></el-icon>
              导入Excel
            </el-button>
          </el-upload>
          <el-button type="info" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出Excel
          </el-button>
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedModels.length === 0">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增型号
          </el-button>
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
                {{ item.regulation_name || '?' }}
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.model_name }}</div>
                <div class="item-sub">{{ item.regulation_name }}</div>
              </div>
            </div>
            <div class="item-details">
              <div class="category">
                <el-tag v-if="item.model_category" size="default" effect="plain">📦 {{ item.model_category }}</el-tag>
                <span v-else class="no-category">未分类</span>
              </div>
              <div class="status">
                <span :class="item.is_active ? 'status-active' : 'status-inactive'"></span>
                {{ item.is_active ? '已启用' : '已禁用' }}
              </div>
            </div>
          </div>
          <div class="card-actions" v-if="authStore.isAdmin">
            <el-button :icon="EditPen" circle @click="handleEdit(item)" title="编辑" />
            <el-button :icon="Delete" circle class="delete-btn" @click="handleDelete(item)" title="删除" />
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <el-table v-if="viewMode === 'list'" :data="paginatedModels" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="regulation_name" label="法规类别" width="150" sortable />
        <el-table-column prop="model_name" label="型号名称" sortable />
        <el-table-column prop="model_category" label="型号分类" sortable />
        <el-table-column prop="is_active" label="状态" width="120" align="center">
          <template #default="{ row }">
            <div class="status">
              <span :class="row.is_active ? 'status-active' : 'status-inactive'"></span>
              {{ row.is_active ? '已启用' : '已禁用' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" v-if="authStore.isAdmin">
          <template #default="{ row }">
            <el-button :icon="EditPen" circle size="small" @click="handleEdit(row)" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-total">共 {{ filteredModels.length }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="filteredModels.length" layout="sizes, prev, pager, next, jumper" />
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="法规类别" required>
          <el-select v-model="form.regulation_id" filterable placeholder="请选择法规类别" style="width: 100%">
            <el-option v-for="reg in regulations" :key="reg.id" :label="reg.name" :value="reg.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号名称" required>
          <el-input v-model="form.model_name" placeholder="请输入型号名称" />
        </el-form-item>
        <el-form-item label="型号分类">
          <el-input v-model="form.model_category" placeholder="请输入型号分类（如：口罩、半面罩）" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, Download, Delete, EditPen, Grid, List, CaretLeft, CaretRight } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'

const authStore = useAuthStore()
const showToolbar = ref(false)
const models = ref([])
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
const pageSize = ref(10)

const totalPages = computed(() => Math.ceil(filteredModels.value.length / pageSize.value) || 1)
const paginatedModels = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredModels.value.slice(start, start + pageSize.value)
})

watch(viewMode, (newMode) => { if (newMode === 'card') selectedModels.value = [] })

const form = reactive({ id: null, regulation_id: null, model_name: '', model_category: '', is_active: 1 })

// 法规颜色映射（与法规管理一致）
const REGULATION_COLORS = { 'NIOSH': '#409EFF', 'GB': '#67C23A', 'CE': '#E6A23C', 'ASNZS': '#F56C6C', 'KN': '#9B59B6' }
const getRegulationColor = (name) => REGULATION_COLORS[name] || '#909399'

const fetchRegulations = async () => {
  try {
    const response = await request.get('/regulations/active')
    if (response.success) regulations.value = response.data
  } catch (error) { ElMessage.error('获取法规列表失败') }
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
    item.model_name.toLowerCase().includes(keyword) || (item.regulation_name && item.regulation_name.toLowerCase().includes(keyword))
  )
}

const handleAdd = () => {
  isEdit.value = false; dialogTitle.value = '新增型号'
  form.id = null; form.regulation_id = null; form.model_name = ''; form.model_category = ''; form.is_active = 1
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true; dialogTitle.value = '编辑型号'
  form.id = row.id; form.regulation_id = row.regulation_id; form.model_name = row.model_name; form.model_category = row.model_category; form.is_active = row.is_active
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.regulation_id) { ElMessage.warning('请选择法规类别'); return }
  if (!form.model_name) { ElMessage.warning('请输入型号名称'); return }
  loading.value = true
  try {
    if (isEdit.value) { await request.put(`/models/${form.id}`, form); ElMessage.success('更新成功') }
    else { await request.post('/models', form); ElMessage.success('创建成功') }
    dialogVisible.value = false; fetchModels()
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

onMounted(() => { fetchRegulations(); fetchModels() })
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

.card-actions { display: flex; justify-content: center; gap: 8px; padding: 12px; border-top: 1px solid #ebeef5; background: #fafafa; border-radius: 0 0 8px 8px; }
.card-actions .el-button { transition: transform 0.2s, box-shadow 0.2s; }
.card-actions .el-button:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }

.delete-btn { color: #F56C6C; }
.delete-btn:hover:not(:disabled) { color: #f78989; border-color: #f78989; }

/* 分页样式 */
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.pagination-total { font-size: 14px; color: #606266; }
.pagination-right { display: flex; align-items: center; gap: 16px; }
.pagination-info { font-size: 14px; color: #606266; }

/* 工具栏折叠 */
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }
</style>
