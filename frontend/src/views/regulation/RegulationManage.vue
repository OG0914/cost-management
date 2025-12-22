<template>
  <div class="regulation-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>法规类别管理</span>
          <el-button type="primary" @click="handleAdd" v-if="authStore.isAdmin">
            <el-icon><Plus /></el-icon>
            新增法规
          </el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="paginatedRegulations" border stripe>
        <el-table-column prop="name" label="法规名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" class="status-tag">
              {{ row.is_active ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
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
        <div class="pagination-total">共 {{ regulations.length }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="regulations.length"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      append-to-body
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="法规名称" required>
          <el-input v-model="form.name" placeholder="请输入法规名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { EditPen, Delete } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useAuthStore } from '../../store/auth'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()

const regulations = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增法规')
const isEdit = ref(false)
const loading = ref(false)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

// 总页数
const totalPages = computed(() => {
  return Math.ceil(regulations.value.length / pageSize.value) || 1
})

// 分页后的数据
const paginatedRegulations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return regulations.value.slice(start, end)
})

const form = reactive({
  id: null,
  name: '',
  description: '',
  is_active: 1
})

// 获取法规列表
const fetchRegulations = async () => {
  try {
    const response = await request.get('/regulations')
    if (response.success) {
      regulations.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取法规列表失败')
  }
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增法规'
  form.id = null
  form.name = ''
  form.description = ''
  form.is_active = 1
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑法规'
  form.id = row.id
  form.name = row.name
  form.description = row.description
  form.is_active = row.is_active
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!form.name) {
    ElMessage.warning('请输入法规名称')
    return
  }

  loading.value = true
  try {
    if (isEdit.value) {
      await request.put(`/regulations/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/regulations', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchRegulations()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除法规"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/regulations/${row.id}`)
    ElMessage.success('删除成功')
    fetchRegulations()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

onMounted(() => {
  fetchRegulations()
})
</script>

<style scoped>
.regulation-manage {
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

.status-tag {
  min-width: 48px;
  text-align: center;
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
</style>
