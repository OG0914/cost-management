<template>
  <div class="material-manage">
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
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增原料
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="materials" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="原料名称" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="price" label="单价" width="120">
          <template #default="{ row }">
            {{ row.price }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="model_name" label="绑定型号" width="150" />
        <el-table-column prop="usage_amount" label="用量" width="100" />
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
        <el-form-item label="原料名称" required>
          <el-input v-model="form.name" placeholder="请输入原料名称" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="form.unit" placeholder="请输入单位（如：kg、个）" />
        </el-form-item>
        <el-form-item label="单价" required>
          <el-input-number v-model="form.price" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币别">
          <el-select v-model="form.currency" style="width: 100%">
            <el-option label="人民币（CNY）" value="CNY" />
            <el-option label="美元（USD）" value="USD" />
            <el-option label="欧元（EUR）" value="EUR" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定型号">
          <el-select v-model="form.model_id" clearable placeholder="可选" style="width: 100%">
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="model.model_name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用量">
          <el-input-number v-model="form.usage_amount" :precision="2" :min="0" style="width: 100%" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()

const materials = ref([])
const models = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增原料')
const isEdit = ref(false)
const loading = ref(false)

const form = reactive({
  id: null,
  name: '',
  unit: '',
  price: 0,
  currency: 'CNY',
  model_id: null,
  usage_amount: null
})

// 是否可编辑（管理员或采购）
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser)

// 获取型号列表
const fetchModels = async () => {
  try {
    const response = await request.get('/models/active')
    if (response.success) {
      models.value = response.data
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 获取原料列表
const fetchMaterials = async () => {
  try {
    const response = await request.get('/materials')
    if (response.success) {
      materials.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取原料列表失败')
  }
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增原料'
  form.id = null
  form.name = ''
  form.unit = ''
  form.price = 0
  form.currency = 'CNY'
  form.model_id = null
  form.usage_amount = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑原料'
  form.id = row.id
  form.name = row.name
  form.unit = row.unit
  form.price = row.price
  form.currency = row.currency
  form.model_id = row.model_id
  form.usage_amount = row.usage_amount
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!form.name || !form.unit || !form.price) {
    ElMessage.warning('请填写必填项')
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

// 导出
const handleExport = async () => {
  try {
    const response = await request.get('/materials/export/excel', {
      responseType: 'blob'
    })
    
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
  fetchModels()
  fetchMaterials()
})
</script>

<style scoped>
.material-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
