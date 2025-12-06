<template>
  <div class="standard-cost-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>标准成本</h2>
        </div>
        <div class="header-right">
          <el-button 
            type="success" 
            icon="DataAnalysis" 
            @click="goToStandardCostCompare"
            :disabled="selectedStandardCosts.length < 2"
          >
            对比模式 ({{ selectedStandardCosts.length }})
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 标准成本历史弹窗 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="标准成本历史版本"
      width="800px"
      destroy-on-close
    >
      <el-table :data="historyList" border v-loading="historyLoading">
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.quantity, 0) }}
          </template>
        </el-table-column>
        <el-table-column label="最终价格" width="150">
          <template #default="{ row }">
            {{ formatNumber(row.sales_type === 'domestic' ? row.domestic_price : row.export_price) }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="setter_name" label="设置人" width="100" />
        <el-table-column prop="created_at" label="设置时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_current ? 'success' : 'info'" size="small">
              {{ row.is_current ? '当前版本' : '历史版本' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button 
              v-if="!row.is_current" 
              size="small" 
              type="primary"
              @click="restoreVersion(row)"
            >
              恢复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-card>
      <!-- 标准成本筛选 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="产品类别">
          <el-select v-model="searchForm.model_category" placeholder="请选择产品类别" clearable style="width: 150px">
            <el-option v-for="cat in modelCategories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model_name" placeholder="请输入型号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStandardCosts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 标准成本表格 -->
      <el-table :data="standardCosts" border v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="model_category" label="产品类别" width="100" />
        <el-table-column prop="model_name" label="型号" width="120" />
        <el-table-column prop="packaging_config_name" label="包装方式" width="220">
          <template #default="{ row }">
            <div v-if="row.packaging_config_name">
              <div>{{ row.packaging_config_name }}</div>
              <div style="color: #909399; font-size: 12px;">
                {{ row.pc_per_bag }}片/袋, {{ row.bags_per_box }}袋/盒, {{ row.boxes_per_carton }}盒/箱
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.quantity, 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="sales_type" label="销售类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.sales_type === 'domestic' ? 'success' : 'primary'" size="small">
              {{ row.sales_type === 'domestic' ? '内销' : '外销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最终价格" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.sales_type === 'domestic' ? row.domestic_price : row.export_price) }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80">
          <template #default="{ row }">
            V{{ row.version }}
          </template>
        </el-table-column>
        <el-table-column prop="setter_name" label="设置人" width="100" />
        <el-table-column prop="created_at" label="设置时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="copyStandardCost(row)">
              复制
            </el-button>
            <el-button 
              v-if="isAdminOrReviewer" 
              size="small" 
              type="warning"
              @click="showHistory(row)"
            >
              历史
            </el-button>
            <el-button 
              v-if="isAdminOrReviewer" 
              size="small" 
              type="danger"
              @click="deleteStandardCost(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, DataAnalysis } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import { getUser } from '@/utils/auth'

const router = useRouter()

// 用户权限
const user = getUser()
const isAdminOrReviewer = computed(() => {
  return user && (user.role === 'admin' || user.role === 'reviewer')
})

// 型号分类列表
const modelCategories = ref([])

// 标准成本数据
const standardCosts = ref([])
const loading = ref(false)
const searchForm = reactive({
  model_category: '',
  model_name: ''
})

// 历史弹窗
const historyDialogVisible = ref(false)
const historyList = ref([])
const historyLoading = ref(false)
const currentStandardCost = ref(null)

// 标准成本选择（用于对比）
const selectedStandardCosts = ref([])

// 加载型号分类
const loadModelCategories = async () => {
  try {
    const res = await request.get('/models/categories')
    if (res.success) {
      modelCategories.value = res.data
    }
  } catch (error) {
    console.error('加载型号分类失败:', error)
  }
}

// 加载标准成本列表
const loadStandardCosts = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.model_category) {
      params.model_category = searchForm.model_category
    }
    if (searchForm.model_name) {
      params.model_name = searchForm.model_name
    }
    
    const res = await request.get('/standard-costs', { params })
    if (res.success) {
      standardCosts.value = res.data
    }
  } catch (error) {
    console.error('加载标准成本列表失败:', error)
    ElMessage.error('加载标准成本列表失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.model_category = ''
  searchForm.model_name = ''
  loadStandardCosts()
}

// 复制标准成本
const copyStandardCost = (row) => {
  router.push({
    path: '/cost/add',
    query: { 
      model_category: row.model_category,
      copyFromStandardCost: row.id 
    }
  })
  ElMessage.success('正在复制标准成本...')
}

// 显示历史版本
const showHistory = async (row) => {
  currentStandardCost.value = row
  historyDialogVisible.value = true
  historyLoading.value = true
  
  try {
    const res = await request.get(`/standard-costs/${row.id}/history`)
    if (res.success) {
      historyList.value = res.data
    }
  } catch (error) {
    console.error('加载历史版本失败:', error)
    ElMessage.error('加载历史版本失败')
  } finally {
    historyLoading.value = false
  }
}

// 恢复历史版本
const restoreVersion = async (row) => {
  const maxVersion = Math.max(...historyList.value.map(h => h.version))
  const newVersion = maxVersion + 1
  
  try {
    await ElMessageBox.confirm(
      `确定要基于 V${row.version} 的内容创建新版本吗？将生成 V${newVersion} 作为当前版本。`,
      '恢复历史版本',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    const res = await request.post(`/standard-costs/${currentStandardCost.value.id}/restore/${row.version}`)
    if (res.success) {
      ElMessage.success(`已基于 V${row.version} 创建新版本 V${newVersion}`)
      historyDialogVisible.value = false
      loadStandardCosts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复版本失败:', error)
      ElMessage.error('恢复版本失败')
    }
  }
}

// 删除标准成本
const deleteStandardCost = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个标准成本吗？这将删除所有历史版本，此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await request.delete(`/standard-costs/${row.packaging_config_id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      loadStandardCosts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedStandardCosts.value = selection
}

// 进入对比模式
const goToStandardCostCompare = () => {
  if (selectedStandardCosts.value.length < 2) {
    ElMessage.warning('请至少选择2个标准成本进行对比')
    return
  }
  
  if (selectedStandardCosts.value.length > 4) {
    ElMessage.warning('最多只能同时对比4个标准成本')
    return
  }
  
  const ids = selectedStandardCosts.value.map(sc => sc.quotation_id).join(',')
  router.push({
    path: '/cost/compare',
    query: { ids, type: 'standard' }
  })
}

// 返回
const goBack = () => {
  router.push('/dashboard')
}

onMounted(() => {
  loadModelCategories()
  loadStandardCosts()
})
</script>

<style scoped>
.standard-cost-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}
</style>
