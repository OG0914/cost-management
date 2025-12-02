<template>
  <div class="model-manage">
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
          <span>型号管理</span>
          <el-space v-if="authStore.isAdmin">
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
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedModels.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增型号
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索型号名称、法规类别"
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
      <el-table :data="filteredModels" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="regulation_name" label="法规类别" width="150" />
        <el-table-column prop="model_name" label="型号名称" />
        <el-table-column prop="model_category" label="型号分类" />
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" class="status-tag">
              {{ row.is_active ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" v-if="authStore.isAdmin">
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
        <el-form-item label="法规类别" required>
          <el-select 
            v-model="form.regulation_id" 
            filterable
            placeholder="请选择法规类别，可输入关键字搜索" 
            style="width: 100%"
          >
            <el-option
              v-for="reg in regulations"
              :key="reg.id"
              :label="reg.name"
              :value="reg.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="型号名称" required>
          <el-input v-model="form.model_name" placeholder="请输入型号名称" />
        </el-form-item>
        <el-form-item label="型号分类">
          <el-input
            v-model="form.model_category"
            placeholder="请输入型号分类（如：口罩、半面罩）"
          />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-switch
            v-model="form.is_active"
            :active-value="1"
            :inactive-value="0"
            active-text="激活"
            inactive-text="禁用"
          />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Search, Upload, Download, Delete } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 返回上一级
const goBack = () => {
  router.push('/dashboard')
}

const models = ref([])
const filteredModels = ref([])
const selectedModels = ref([])
const regulations = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增型号')
const isEdit = ref(false)
const loading = ref(false)
const searchKeyword = ref('')

const form = reactive({
  id: null,
  regulation_id: null,
  model_name: '',
  model_category: '',
  is_active: 1
})

// 获取法规列表
const fetchRegulations = async () => {
  try {
    const response = await request.get('/regulations/active')
    if (response.success) {
      regulations.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取法规列表失败')
  }
}

// 获取型号列表
const fetchModels = async () => {
  try {
    const response = await request.get('/models')
    if (response.success) {
      models.value = response.data
      handleSearch() // 初始化过滤
    }
  } catch (error) {
    ElMessage.error('获取型号列表失败')
  }
}

// 搜索过滤
const handleSearch = () => {
  let result = models.value

  // 关键词搜索（型号名称或法规类别）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.model_name.toLowerCase().includes(keyword) || 
      (item.regulation_name && item.regulation_name.toLowerCase().includes(keyword))
    )
  }

  filteredModels.value = result
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增型号'
  form.id = null
  form.regulation_id = null
  form.model_name = ''
  form.model_category = ''
  form.is_active = 1
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑型号'
  form.id = row.id
  form.regulation_id = row.regulation_id
  form.model_name = row.model_name
  form.model_category = row.model_category
  form.is_active = row.is_active
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!form.regulation_id) {
    ElMessage.warning('请选择法规类别')
    return
  }
  if (!form.model_name) {
    ElMessage.warning('请输入型号名称')
    return
  }

  loading.value = true
  try {
    if (isEdit.value) {
      await request.put(`/models/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/models', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchModels()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除型号"${row.model_name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/models/${row.id}`)
    ElMessage.success('删除成功')
    fetchModels()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请先选择要删除的型号')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedModels.value.length} 条型号吗？此操作不可恢复！`, 
      '批量删除确认', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedModels.value.map(item => item.id)
    
    let successCount = 0
    let failCount = 0
    
    for (const id of ids) {
      try {
        await request.delete(`/models/${id}`)
        successCount++
      } catch (error) {
        failCount++
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 条型号${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)
      fetchModels()
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
    const response = await request.post('/models/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.success) {
      const { created, updated, errors } = response.data
      let message = `导入成功！创建 ${created} 条，更新 ${updated} 条`
      if (errors && errors.length > 0) {
        message += `\n${errors.slice(0, 3).join('\n')}`
        if (errors.length > 3) {
          message += `\n...还有 ${errors.length - 3} 条错误`
        }
      }
      ElMessage.success(message)
      fetchModels()
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedModels.value = selection
}

// 导出
const handleExport = async () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }

  try {
    const ids = selectedModels.value.map(item => item.id)
    const response = await request.post('/models/export/excel', 
      { ids },
      { responseType: 'blob' }
    )
    
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `型号清单_${Date.now()}.xlsx`)
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
    const response = await request.get('/models/template/download', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '型号导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  fetchRegulations()
  fetchModels()
})
</script>

<style scoped>
.model-manage {
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

.status-tag {
  min-width: 48px;
  text-align: center;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
