<template>
  <div class="material-manage">
    <PageHeader title="原料管理">
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
    </PageHeader>

    <el-card>

      <!-- 搜索栏 -->
      <div class="filter-bar">
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
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="item_no" label="品号" width="140" />
        <el-table-column prop="name" label="原料名称" width="370" />
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
      <el-form :model="form" label-width="100px">
        <el-form-item label="品号" required>
          <el-input v-model="form.item_no" placeholder="请输入品号" />
        </el-form-item>
        <el-form-item label="原料名称" required>
          <el-input v-model="form.name" placeholder="请输入原料名称" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="单价" required>
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Delete, Search, EditPen, CaretLeft, CaretRight } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { formatNumber, formatDateTime } from '../../utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import CommonPagination from '@/components/common/CommonPagination.vue'
import ActionButton from '@/components/common/ActionButton.vue'

const authStore = useAuthStore()
const showToolbar = ref(false)

// 表格数据（从后端获取的当前页数据）
const tableData = ref([])
const selectedMaterials = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增原料')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 防抖定时器
let searchTimer = null

const form = reactive({
  id: null,
  item_no: '',
  name: '',
  unit: '',
  price: null,
  currency: 'CNY',
  manufacturer: '',
  usage_amount: null
})

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
        keyword: searchKeyword.value || undefined
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
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 设置新的定时器
  searchTimer = setTimeout(() => {
    currentPage.value = 1  // 搜索时重置到第一页
    fetchMaterials()
  }, 300)
}

// 清空搜索框时立即触发查询
const handleClearSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
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
  form.unit = row.unit
  form.price = row.price
  form.currency = row.currency
  form.manufacturer = row.manufacturer || ''
  form.usage_amount = row.usage_amount
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!form.item_no || !form.name || !form.unit || !form.price) {
    ElMessage.warning('请填写品号、原料名称、单位和单价')
    return
  }

  loading.value = true
  try {
    if (isEdit.value) {
      await request.put(`/materials/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/materials', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchMaterials()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
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
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedMaterials.value.map(item => item.id)
    
    // 逐个删除
    let successCount = 0
    let failCount = 0
    
    for (const id of ids) {
      try {
        await request.delete(`/materials/${id}`)
        successCount++
      } catch (error) {
        failCount++
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 条原料${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)
      fetchMaterials()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

// 文件选择
const handleFileChange = async (file) => {
  const formData = new FormData()
  formData.append('file', file.raw)

  try {
    const response = await request.post('/materials/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.success) {
      ElMessage.success(`导入成功！创建 ${response.data.created} 条，更新 ${response.data.updated} 条`)
      fetchMaterials()
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedMaterials.value = selection
}

// 导出
const handleExport = async () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }

  try {
    const ids = selectedMaterials.value.map(item => item.id)
    const response = await request.post('/materials/export/excel', 
      { ids },
      { responseType: 'blob' }
    )
    
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `原料清单_${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const response = await request.get('/materials/template/download', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '原料导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  fetchMaterials()
})
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
