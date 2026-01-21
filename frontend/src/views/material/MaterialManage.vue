<template>
  <div class="material-manage">
    <CostPageHeader title="原料管理" :show-back="false">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && canEdit">
              <ActionButton type="download" @click="handleDownloadTemplate">下载模板</ActionButton>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <ActionButton type="import">导入Excel</ActionButton>
              </el-upload>
              <ActionButton type="export" @click="handleExport">导出Excel</ActionButton>
              <ActionButton type="delete" :disabled="selectedMaterials.length === 0" @click="handleBatchDelete">批量删除</ActionButton>
              <ActionButton type="add" @click="handleAdd">新增原料</ActionButton>
            </el-space>
          </transition>
        </div>
      </template>
    </CostPageHeader>

    <el-card>

      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-select v-model="filterCategory" placeholder="选择类别" clearable @change="handleCategoryChange" style="width: 150px; margin-right: 12px">
          <el-option v-for="cat in categoryOptions" :key="cat.name" :label="cat.name" :value="cat.name" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索品号、原料名称"
          clearable
          @input="handleSearch"
          @clear="handleClearSearch"
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange" empty-text="暂无原料数据">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="item_no" label="品号" width="140" />
        <el-table-column prop="name" label="原料名称" width="300" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">{{ row.category || '-' }}</template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="币别" width="100" />
        <el-table-column prop="manufacturer" label="厂商" width="120" />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" v-if="canEdit">
          <template #default="{ row }">
            <el-button :icon="EditPen" circle size="small" @click="handleEdit(row)" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <CommonPagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total" />
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
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="品号" prop="item_no">
          <el-input v-model="form.item_no" placeholder="请输入品号" />
        </el-form-item>
        <el-form-item label="原料名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入原料名称" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="form.category" placeholder="请选择类别" clearable style="width: 100%">
            <el-option v-for="cat in categoryOptions" :key="cat.name" :label="cat.name" :value="cat.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币别">
          <el-select v-model="form.currency" style="width: 100%">
            <el-option label="人民币（CNY）" value="CNY" />
            <el-option label="美元（USD）" value="USD" />
            <el-option label="欧元（EUR）" value="EUR" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商">
          <el-input v-model="form.manufacturer" placeholder="请输入厂商名称（可选）" />
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
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Delete, Search, EditPen, CaretLeft, CaretRight } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { useConfigStore } from '../../store/config'
import { formatNumber, formatDateTime, downloadBlob } from '../../utils/format'
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import { usePagination } from '@/composables/usePagination'
import CommonPagination from '@/components/common/CommonPagination.vue'
import ActionButton from '@/components/common/ActionButton.vue'

const authStore = useAuthStore()
const configStore = useConfigStore()
const showToolbar = ref(false)

// 类别选项和筛选
const categoryOptions = computed(() => configStore.config?.material_categories || [])
const filterCategory = ref('')

// 表格数据（从后端获取的当前页数据）
const tableData = ref([])
const selectedMaterials = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增原料')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')

// 分页状态
const { currentPage, pageSize, total } = usePagination('material')

// 防抖定时器
const searchTimer = ref(null)

const form = reactive({
  id: null,
  item_no: '',
  name: '',
  category: '',
  unit: '',
  price: null,
  currency: 'CNY',
  manufacturer: '',
  usage_amount: null
})

// 表单引用和校验规则
const formRef = ref(null)
const formRules = {
  item_no: [{ required: true, message: '请输入品号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入原料名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

// 是否可编辑（管理员或采购）
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser)

// 获取原料列表（后端分页）
const fetchMaterials = async () => {
  loading.value = true
  try {
    const response = await request.get('/materials', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value || undefined,
        category: filterCategory.value || undefined
      }
    })
    if (response.success) {
      tableData.value = response.data
      total.value = response.total
    }
  } catch (error) {
    ElMessage.error('获取原料列表失败')
  } finally {
    loading.value = false
  }
}

// 防抖搜索（300ms）
const handleSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => { currentPage.value = 1; fetchMaterials() }, 300)
}

// 清空搜索框时立即触发查询
const handleClearSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  currentPage.value = 1
  fetchMaterials()
}

// 类别筛选变化
const handleCategoryChange = () => {
  currentPage.value = 1
  fetchMaterials()
}

// 监听分页参数变化
watch([currentPage, pageSize], () => {
  fetchMaterials()
})

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增原料'
  form.id = null
  form.item_no = ''
  form.name = ''
  form.category = ''
  form.unit = ''
  form.price = null
  form.currency = 'CNY'
  form.manufacturer = ''
  form.usage_amount = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑原料'
  form.id = row.id
  form.item_no = row.item_no
  form.name = row.name
  form.category = row.category || ''
  form.unit = row.unit
  form.price = row.price ? parseFloat(row.price) : null
  form.currency = row.currency
  form.manufacturer = row.manufacturer || ''
  form.usage_amount = row.usage_amount ? parseFloat(row.usage_amount) : null
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    if (isEdit.value) { await request.put(`/materials/${form.id}`, form); ElMessage.success('更新成功') }
    else { await request.post('/materials', form); ElMessage.success('创建成功') }
    dialogVisible.value = false; fetchMaterials()
  } catch (error) { /* 错误已在拦截器处理 */ }
  finally { loading.value = false }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除原料"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/materials/${row.id}`)
    ElMessage.success('删除成功')
    fetchMaterials()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请先选择要删除的原料')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedMaterials.value.length} 条原料吗？此操作不可恢复！`, 
      '批量删除确认', 
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )

    const ids = selectedMaterials.value.map(item => item.id)
    const res = await request.post('/materials/batch-delete', { ids })
    
    if (res.success) {
      const { deleted, failed } = res.data
      if (deleted > 0 && failed.length === 0) {
        ElMessage.success(`成功删除 ${deleted} 条原料`)
      } else if (deleted > 0 && failed.length > 0) {
        ElMessage.warning(`成功删除 ${deleted} 条，${failed.length} 条因被引用无法删除`)
      } else if (failed.length > 0) {
        ElMessage.error(`${failed.length} 条原料被引用，无法删除`)
      }
      fetchMaterials()
    }
  } catch (error) {
    if (error !== 'cancel') { /* 错误已在拦截器处理 */ }
  }
}

// 文件选择与导入
const importFile = ref(null)
const handleFileChange = async (file) => {
  importFile.value = file.raw
  const formData = new FormData()
  formData.append('file', file.raw)

  try {
    const response = await request.post('/materials/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.success) {
      // 检查是否需要确认重复品号
      if (response.data.needConfirm && response.data.duplicates?.length > 0) {
        const duplicateList = response.data.duplicates.slice(0, 10).map(d => `${d.item_no} (${d.name})`).join('\n')
        const suffix = response.data.duplicates.length > 10 ? `\n...等${response.data.duplicates.length}个` : ''
        
        try {
          const action = await ElMessageBox.confirm(
            `发现 ${response.data.duplicates.length} 个重复品号：\n\n${duplicateList}${suffix}\n\n请选择处理方式：`,
            '发现重复品号',
            {
              distinguishCancelAndClose: true,
              confirmButtonText: '更新已有数据',
              cancelButtonText: '跳过重复项',
              type: 'warning'
            }
          )
          // 用户点击"更新已有数据"
          await confirmImportWithMode('update')
        } catch (action) {
          if (action === 'cancel') {
            // 用户点击"跳过重复项"
            await confirmImportWithMode('skip')
          }
          // 用户点击关闭，取消导入
        }
      } else {
        ElMessage.success(`导入成功！创建 ${response.data.created} 条`)
        fetchMaterials()
      }
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 确认导入（带模式）
const confirmImportWithMode = async (mode) => {
  if (!importFile.value) return
  
  const formData = new FormData()
  formData.append('file', importFile.value)
  
  try {
    // 重新上传并预检查
    const preResponse = await request.post('/materials/import/precheck', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (preResponse.success && preResponse.data.importId) {
      // 确认导入
      const confirmResponse = await request.post('/materials/import/confirm', {
        importId: preResponse.data.importId,
        mode
      })
      
      if (confirmResponse.success) {
        const { created, updated, skipped } = confirmResponse.data
        const msg = [`导入成功！创建 ${created} 条`]
        if (updated > 0) msg.push(`更新 ${updated} 条`)
        if (skipped > 0) msg.push(`跳过 ${skipped} 条`)
        ElMessage.success(msg.join('，'))
        fetchMaterials()
      }
    }
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    importFile.value = null
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedMaterials.value = selection
}

// 导出
const handleExport = async () => {
  if (selectedMaterials.value.length === 0) { ElMessage.warning('请先选择要导出的数据'); return }
  try {
    const ids = selectedMaterials.value.map(item => item.id)
    const res = await request.post('/materials/export/excel', { ids }, { responseType: 'blob' })
    downloadBlob(res, `原料清单_${Date.now()}.xlsx`); ElMessage.success('导出成功')
  } catch (error) { ElMessage.error('导出失败') }
}

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const res = await request.get('/materials/template/download', { responseType: 'blob' })
    downloadBlob(res, '原料导入模板.xlsx'); ElMessage.success('下载成功')
  } catch (error) { ElMessage.error('下载失败') }
}

onMounted(async () => {
  await configStore.loadConfig()
  fetchMaterials()
})

onUnmounted(() => { if (searchTimer.value) clearTimeout(searchTimer.value) })
</script>

<style scoped>
.material-manage {
  /* padding 由 MainLayout 提供 */
}

.page-header {
  margin-bottom: 16px;
}

.back-button {
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.pagination-total {
  font-size: 14px;
  color: #606266;
}

.pagination-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

/* 操作按钮悬停效果 */
.el-table .el-button.is-circle {
  transition: transform 0.2s, box-shadow 0.2s;
}

.el-table .el-button.is-circle:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 删除按钮样式 */
.delete-btn {
  color: #F56C6C;
}

.delete-btn:hover:not(:disabled) {
  color: #f78989;
  border-color: #f78989;
}

/* 表头浅色底色 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
}

/* 工具栏折叠 */
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }
</style>
