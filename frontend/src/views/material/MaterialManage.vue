<template>
  <div class="material-manage">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回上一级
      </el-button>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>原料管理</span>
          <el-space v-if="canEdit">
            <el-button type="success" @click="handleDownloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".xlsx,.xls"
            >
              <el-button type="warning">
                <el-icon><Upload /></el-icon>
                导入Excel
              </el-button>
            </el-upload>
            <el-button type="info" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedMaterials.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增原料
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索品号、原料名称"
          clearable
          @input="handleSearch"
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 数据表格 -->
      <el-table :data="filteredMaterials" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="item_no" label="品号" width="120" />
        <el-table-column prop="name" label="原料名称" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="price" label="单价" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="币别" width="100" />
        <el-table-column prop="manufacturer" label="厂商" width="150" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="200" v-if="canEdit">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="品号" required>
          <el-input v-model="form.item_no" placeholder="请输入品号（如：MAT001）" />
        </el-form-item>
        <el-form-item label="原料名称" required>
          <el-input v-model="form.name" placeholder="请输入原料名称" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="form.unit" placeholder="请输入单位（如：kg、个）" />
        </el-form-item>
        <el-form-item label="单价" required>
          <el-input-number v-model="form.price" :precision="2" :min="0" :controls="false" style="width: 100%" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, ArrowLeft, Delete, Search } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { formatNumber } from '../../utils/format'

const router = useRouter()
const authStore = useAuthStore()

// 返回上一级
const goBack = () => {
  router.push('/dashboard')
}

const materials = ref([])
const filteredMaterials = ref([])
const selectedMaterials = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增原料')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')

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

// 获取原料列表
const fetchMaterials = async () => {
  try {
    const response = await request.get('/materials')
    if (response.success) {
      materials.value = response.data
      handleSearch() // 初始化过滤
    }
  } catch (error) {
    ElMessage.error('获取原料列表失败')
  }
}

// 搜索过滤
const handleSearch = () => {
  let result = materials.value

  // 关键词搜索（品号或原料名称）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.item_no.toLowerCase().includes(keyword) || 
      item.name.toLowerCase().includes(keyword)
    )
  }

  filteredMaterials.value = result
}

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
  padding: 20px;
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
</style>
