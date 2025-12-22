<template>
  <div class="pending-review-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2>📋 待审核记录</h2>
        </div>
      </div>
    </el-card>

    <el-card>
      <!-- 搜索框 -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索报价单编号、客户名称、型号"
          clearable
          @input="handleLocalSearch"
          style="width: 350px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 数据表格 -->
      <el-table :data="paginatedList" border v-loading="loading" style="width: 100%">
        <el-table-column prop="quotation_no" label="报价单编号" width="160" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.sales_type === 'domestic' ? 'success' : 'warning'" size="small">
              {{ getSalesTypeName(row.sales_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户名称" min-width="120" />
        <el-table-column prop="model_name" label="型号" width="120" />
        <el-table-column prop="config_name" label="包装方式" width="220">
          <template #default="{ row }">
            <div v-if="row.config_name">
              <div>{{ row.config_name }}</div>
              <div style="color: #909399; font-size: 12px;">
                {{ formatPackagingSpec(row) }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120">
          <template #default="{ row }">
            {{ formatQuantity(row.quantity) }}
          </template>
        </el-table-column>
        <el-table-column prop="final_price" label="最终价格" width="120">
          <template #default="{ row }">
            {{ formatAmount(row.final_price, row.currency) }}
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="90" />
        <el-table-column prop="submitted_at" label="提交时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.submitted_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <!-- 管理员/审核人可以审核 -->
            <el-button v-if="canReview" type="primary" size="small" @click="handleReview(row)">审核</el-button>
            <!-- 业务员只能查看 -->
            <el-button v-else type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button 
              v-if="isAdmin" 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-total">共 {{ filteredList.length }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredList.length"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>

    <!-- 审核详情弹窗（管理员/审核人） -->
    <ReviewDetailDialog
      v-model="reviewDialogVisible"
      :quotation-id="currentQuotationId"
      @approved="handleApproved"
      @rejected="handleRejected"
    />
    
    <!-- 查看详情弹窗（业务员） -->
    <ApprovedDetailDialog
      v-model="viewDialogVisible"
      :quotation-id="currentQuotationId"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useReviewStore } from '@/store/review'
import { useAuthStore } from '@/store/auth'
import { 
  getStatusType, 
  getStatusName, 
  getSalesTypeName,
  formatDateTime, 
  formatAmount, 
  formatQuantity 
} from '@/utils/review'
import ReviewDetailDialog from '@/components/review/ReviewDetailDialog.vue'
import ApprovedDetailDialog from '@/components/review/ApprovedDetailDialog.vue'

const reviewStore = useReviewStore()
const authStore = useAuthStore()

// 搜索关键词
const searchKeyword = ref('')

// 全量数据和过滤后数据
const allList = ref([])
const filteredList = ref([])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize.value) || 1
})

// 分页后的数据
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 弹窗状态
const reviewDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentQuotationId = ref(null)

// 计算属性
const loading = computed(() => reviewStore.loading)
const isAdmin = computed(() => authStore.user?.role === 'admin')
const canReview = computed(() => authStore.user?.role === 'admin' || authStore.user?.role === 'reviewer')

// 格式化包装规格显示（根据二层或三层）
const formatPackagingSpec = (row) => {
  if (!row.packaging_type) return ''
  if (row.packaging_type === 'no_box') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/箱`
  } else if (row.packaging_type === 'blister_direct') {
    return `${row.layer1_qty}pc/泡壳, ${row.layer2_qty}泡壳/箱`
  } else if (row.packaging_type === 'blister_bag') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/泡壳, ${row.layer3_qty}泡壳/箱`
  }
  return `${row.layer1_qty}片/袋, ${row.layer2_qty}袋/盒, ${row.layer3_qty}盒/箱`
}

// 本地搜索过滤
const handleLocalSearch = () => {
  let result = allList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      (item.quotation_no && item.quotation_no.toLowerCase().includes(keyword)) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(keyword)) ||
      (item.model_name && item.model_name.toLowerCase().includes(keyword))
    )
  }

  filteredList.value = result
  currentPage.value = 1
}

// 加载数据（一次性加载全部）
const loadData = async () => {
  try {
    await reviewStore.fetchPendingList({ page: 1, pageSize: 9999 })
    allList.value = reviewStore.pendingList
    handleLocalSearch()
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

// 审核（管理员/审核人）
const handleReview = (row) => {
  currentQuotationId.value = row.id
  reviewDialogVisible.value = true
}

// 查看（业务员）
const handleView = (row) => {
  currentQuotationId.value = row.id
  viewDialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报价单 ${row.quotation_no} 吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
    await reviewStore.deleteQuotation(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 审核完成回调
const handleApproved = () => {
  reviewDialogVisible.value = false
  ElMessage.success('审核通过成功')
  loadData()
}

const handleRejected = () => {
  reviewDialogVisible.value = false
  ElMessage.success('退回成功')
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.pending-review-container {
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

.header-left h2 {
  margin: 0;
  font-size: 18px;
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
</style>
