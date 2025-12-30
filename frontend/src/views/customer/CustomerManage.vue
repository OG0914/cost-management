<template>
  <div class="customer-manage">
    <PageHeader title="客户管理">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && canEdit">
              <el-button type="success" @click="handleDownloadTemplate">
                <el-icon><Download /></el-icon>下载模板
              </el-button>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <el-button type="warning"><el-icon><Upload /></el-icon>导入Excel</el-button>
              </el-upload>
              <el-button type="info" @click="handleExport">
                <el-icon><Download /></el-icon>导出Excel
              </el-button>
              <el-button type="danger" @click="handleBatchDelete" :disabled="selectedCustomers.length === 0">
                <el-icon><Delete /></el-icon>批量删除
              </el-button>
              <el-button type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon>新增客户
              </el-button>
            </el-space>
          </transition>
        </div>
      </template>
    </PageHeader>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索VC号、客户名称、地区" clearable @input="handleSearch" @clear="handleClearSearch" style="width: 300px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="vc_code" label="VC号" width="120" />
        <el-table-column prop="name" label="客户名称" width="400" />
        <el-table-column prop="region" label="地区" width="120" />
        <el-table-column prop="remark" label="备注" min-width="100" />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" v-if="canEdit">
          <template #default="{ row }">
            <el-button :icon="EditPen" circle size="small" @click="handleEdit(row)" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <CommonPagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="VC号" required>
          <el-input v-model="form.vc_code" placeholder="请输入VC号" />
        </el-form-item>
        <el-form-item label="客户名称" required>
          <el-input v-model="form.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="form.region" placeholder="请输入地区" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import request from '@/utils/request'
import { useAuthStore } from '@/store/auth'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import CommonPagination from '@/components/common/CommonPagination.vue'

const authStore = useAuthStore()
const showToolbar = ref(false)
const tableData = ref([])
const selectedCustomers = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增客户')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
let searchTimer = null

const form = reactive({ id: null, vc_code: '', name: '', region: '', remark: '' })
const canEdit = computed(() => authStore.isAdmin || authStore.user?.role === 'reviewer')

const fetchCustomers = async () => {
  loading.value = true
  try {
    const res = await request.get('/customers', { params: { page: currentPage.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined } })
    if (res.success) { tableData.value = res.data; total.value = res.total }
  } catch (e) { ElMessage.error('获取客户列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { currentPage.value = 1; fetchCustomers() }, 300) }
const handleClearSearch = () => { if (searchTimer) clearTimeout(searchTimer); currentPage.value = 1; fetchCustomers() }
watch([currentPage, pageSize], fetchCustomers)

const handleAdd = () => { isEdit.value = false; dialogTitle.value = '新增客户'; Object.assign(form, { id: null, vc_code: '', name: '', region: '', remark: '' }); dialogVisible.value = true }
const handleEdit = (row) => { isEdit.value = true; dialogTitle.value = '编辑客户'; Object.assign(form, row); dialogVisible.value = true }

const handleSubmit = async () => {
  if (!form.vc_code || !form.name) { ElMessage.warning('请填写VC号和客户名称'); return }
  loading.value = true
  try {
    if (isEdit.value) { await request.put(`/customers/${form.id}`, form); ElMessage.success('更新成功') }
    else { await request.post('/customers', form); ElMessage.success('创建成功') }
    dialogVisible.value = false; fetchCustomers()
  } catch (e) { /* handled */ }
  finally { loading.value = false }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除客户"${row.name}"吗？`, '提示', { type: 'warning' })
    await request.delete(`/customers/${row.id}`); ElMessage.success('删除成功'); fetchCustomers()
  } catch (e) { if (e !== 'cancel') { /* handled */ } }
}

const handleBatchDelete = async () => {
  if (selectedCustomers.value.length === 0) { ElMessage.warning('请先选择要删除的客户'); return }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedCustomers.value.length} 条客户吗？`, '批量删除确认', { type: 'warning' })
    const ids = selectedCustomers.value.map(c => c.id)
    await request.post('/customers/batch-delete', { ids }); ElMessage.success('批量删除成功'); fetchCustomers()
  } catch (e) { if (e !== 'cancel') { /* handled */ } }
}

const handleFileChange = async (file) => {
  const formData = new FormData(); formData.append('file', file.raw)
  try {
    const res = await request.post('/customers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.success) { ElMessage.success(`导入成功！创建 ${res.data.created} 条，更新 ${res.data.updated} 条`); fetchCustomers() }
  } catch (e) { /* handled */ }
}

const handleSelectionChange = (selection) => { selectedCustomers.value = selection }

const handleExport = async () => {
  if (selectedCustomers.value.length === 0) { ElMessage.warning('请先选择要导出的数据'); return }
  try {
    const ids = selectedCustomers.value.map(c => c.id)
    const res = await request.post('/customers/export/excel', { ids }, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', `客户列表_${Date.now()}.xlsx`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link); ElMessage.success('导出成功')
  } catch (e) { ElMessage.error('导出失败') }
}

const handleDownloadTemplate = async () => {
  try {
    const res = await request.get('/customers/template/download', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', '客户导入模板.xlsx')
    document.body.appendChild(link); link.click(); document.body.removeChild(link); ElMessage.success('下载成功')
  } catch (e) { ElMessage.error('下载失败') }
}

onMounted(fetchCustomers)
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; display: flex; align-items: center; }
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }
.delete-btn { color: #F56C6C; }
.delete-btn:hover:not(:disabled) { color: #f78989; border-color: #f78989; }
.el-table .el-button.is-circle { transition: transform 0.2s, box-shadow 0.2s; }
.el-table .el-button.is-circle:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
:deep(.el-table th.el-table__cell) { background-color: #f5f7fa; }
</style>
