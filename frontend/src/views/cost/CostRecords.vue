<template>
  <div class="cost-records-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2>成本记录</h2>
        </div>
        <div class="header-right">
          <el-button 
            type="success" 
            icon="DataAnalysis" 
            @click="goToCompare"
            :disabled="selectedQuotations.length < 2"
          >
            对比模式 ({{ selectedQuotations.length }})
          </el-button>
          <el-button type="primary" icon="Plus" @click="showCategoryModal">新增报价单</el-button>
        </div>
      </div>
    </el-card>

    <!-- 产品类别选择弹窗 -->
    <ProductCategoryModal
      v-model="categoryModalVisible"
      @confirm="onCategoryConfirm"
    />

    <el-card>
      <!-- 搜索框 -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索报价单编号、客户名称、型号"
          clearable
          @input="handleSearch"
          @clear="handleClearSearch"
          style="width: 350px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" border v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="quotation_no" label="报价单编号" width="180">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>{{ row.quotation_no }}</span>
              <svg v-if="row.is_standard_cost" class="standard-stamp-icon" viewBox="0 0 24 24" width="20" height="20" title="标准成本">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#E6A23C" stroke-width="2"/>
                <circle cx="12" cy="12" r="7" fill="none" stroke="#E6A23C" stroke-width="1.5"/>
                <text x="12" y="15" text-anchor="middle" fill="#E6A23C" font-size="7" font-weight="bold">标准</text>
              </svg>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.sales_type === 'domestic' ? 'success' : 'warning'" size="small">
              {{ row.sales_type === 'domestic' ? '内销' : '外销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="customer_region" label="客户地区" width="100" />
        <el-table-column prop="model_category" label="产品类别" width="100" />
        <el-table-column prop="model_name" label="型号" width="120" />
        <el-table-column prop="packaging_config_name" label="包装方式" width="220">
          <template #default="{ row }">
            <div v-if="row.packaging_config_name">
              <div>{{ row.packaging_config_name }}</div>
              <div style="color: #909399; font-size: 12px;">
                {{ formatPackagingSpec(row) }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            {{ formatQuantity(row.quantity) }}
          </template>
        </el-table-column>
        <el-table-column prop="final_price" label="最终价格" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.final_price) }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button :icon="View" circle size="small" @click="viewDetail(row.id)" title="查看" />
            <el-button v-if="canEdit(row)" :icon="EditPen" circle size="small" @click="editQuotation(row.id)" title="编辑" />
            <el-button :icon="CopyDocument" circle size="small" @click="copyQuotation(row.id)" title="复制" />
            <el-button v-if="canDelete(row)" :icon="Delete" circle size="small" class="delete-btn" @click="deleteQuotation(row.id)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-total">共 {{ total }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View, EditPen, CopyDocument, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber, formatDateTime } from '@/utils/format'
import { formatQuantity } from '@/utils/review'
import { getUser } from '@/utils/auth'
import ProductCategoryModal from '@/components/ProductCategoryModal.vue'

const router = useRouter()

// 产品类别选择弹窗
const categoryModalVisible = ref(false)

// 用户权限
const user = getUser()

// 搜索关键词
const searchKeyword = ref('')

// 表格数据（从后端获取的当前页数据）
const tableData = ref([])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 防抖定时器
let searchTimer = null

// 总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value) || 1
})

// 格式化包装规格显示（根据二层或三层）
const formatPackagingSpec = (row) => {
  if (!row.packaging_type) return ''
  // 二层包装类型：no_box, blister_direct
  if (row.packaging_type === 'no_box') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/箱`
  } else if (row.packaging_type === 'blister_direct') {
    return `${row.layer1_qty}pc/泡壳, ${row.layer2_qty}泡壳/箱`
  } else if (row.packaging_type === 'blister_bag') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/泡壳, ${row.layer3_qty}泡壳/箱`
  }
  // 默认三层：standard_box
  return `${row.layer1_qty}片/袋, ${row.layer2_qty}袋/盒, ${row.layer3_qty}盒/箱`
}

const loading = ref(false)
const selectedQuotations = ref([])

// 获取报价单列表（后端分页）
const fetchQuotations = async () => {
  loading.value = true
  try {
    const res = await request.get('/cost/quotations', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value || undefined
      }
    })
    if (res.success) {
      tableData.value = res.data
      total.value = res.total
    }
  } catch (error) {
    console.error('加载报价单列表失败:', error)
    ElMessage.error('加载报价单列表失败')
  } finally {
    loading.value = false
  }
}

// 防抖搜索（300ms）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    currentPage.value = 1 // 搜索时重置到第一页
    fetchQuotations()
  }, 300)
}

// 清空搜索框时立即触发查询
const handleClearSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  currentPage.value = 1
  fetchQuotations()
}

// 监听分页参数变化
watch([currentPage, pageSize], () => {
  fetchQuotations()
})

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审核',
    rejected: '已退回'
  }
  return textMap[status] || status
}




// 显示产品类别选择弹窗
const showCategoryModal = () => {
  categoryModalVisible.value = true
}

// 产品类别选择确认
const onCategoryConfirm = (category) => {
  router.push({
    path: '/cost/add',
    query: { model_category: category }
  })
}

// 判断是否可以编辑
const canEdit = (row) => {
  return row.status === 'draft' || row.status === 'rejected'
}

// 判断是否可以删除
const canDelete = (row) => {
  if (user && user.role === 'admin') {
    return true
  }
  return row.status === 'draft'
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/cost/detail/${id}`)
}

// 编辑报价单
const editQuotation = (id) => {
  router.push(`/cost/edit/${id}`)
}

// 复制报价单
const copyQuotation = async (id) => {
  try {
    await ElMessageBox.confirm('确定要复制这个报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const res = await request.get(`/cost/quotations/${id}`)
    
    if (res.success) {
      router.push({
        path: '/cost/add',
        query: { copyFrom: id }
      })
      ElMessage.success('正在复制报价单...')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制失败:', error)
      ElMessage.error('复制失败')
    }
  }
}

// 删除报价单
const deleteQuotation = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await request.delete(`/cost/quotations/${id}`)
    
    if (res.success) {
      ElMessage.success('删除成功')
      fetchQuotations()
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
  selectedQuotations.value = selection
}

// 检查是否可选择
const checkSelectable = (row) => {
  return row.status === 'approved' || row.status === 'submitted'
}

// 进入对比模式
const goToCompare = () => {
  if (selectedQuotations.value.length < 2) {
    ElMessage.warning('请至少选择2个报价单进行对比')
    return
  }
  
  if (selectedQuotations.value.length > 4) {
    ElMessage.warning('最多只能同时对比4个报价单')
    return
  }
  
  const ids = selectedQuotations.value.map(q => q.id).join(',')
  router.push({
    path: '/cost/compare',
    query: { ids }
  })
}

onMounted(() => {
  fetchQuotations()
})
</script>

<style scoped>
.cost-records-container {
  /* padding 由 MainLayout 提供 */
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

.filter-bar {
  margin-bottom: 16px;
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

/* 标准成本盖章图标 */
.standard-stamp-icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.standard-stamp-icon:hover {
  opacity: 1;
  transform: scale(1.1);
  transition: all 0.2s;
}
</style>
