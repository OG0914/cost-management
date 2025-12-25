<template>
  <div class="approved-review-container">
    <PageHeader title="已审核记录" />

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
      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
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
        <el-table-column prop="reviewer_name" label="审核人" width="90" />
        <el-table-column prop="reviewed_at" label="审核时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.reviewed_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
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
        <div class="pagination-info-left">
          <span class="pagination-total">共 {{ total }} 条记录</span>
          <span class="hint-text">💡 此列表显示已通过和已退回的报价单</span>
        </div>
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

    <!-- 已审核详情弹窗 -->
    <ApprovedDetailDialog
      v-model="detailDialogVisible"
      :quotation-id="currentQuotationId"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useReviewStore } from '@/store/review'
import { useAuthStore } from '@/store/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import { 
  getStatusType, 
  getStatusName, 
  getSalesTypeName,
  formatDateTime, 
  formatAmount, 
  formatQuantity 
} from '@/utils/review'
import ApprovedDetailDialog from '@/components/review/ApprovedDetailDialog.vue'

const reviewStore = useReviewStore()
const authStore = useAuthStore()

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

// 弹窗状态
const detailDialogVisible = ref(false)
const currentQuotationId = ref(null)

// 计算属性
const loading = computed(() => reviewStore.loading)
const isAdmin = computed(() => authStore.user?.role === 'admin')

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

// 获取已审核列表（后端分页）
const fetchApprovedList = async () => {
  try {
    await reviewStore.fetchApprovedList({
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value || undefined
    })
    tableData.value = reviewStore.approvedList
    total.value = reviewStore.approvedPagination.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

// 防抖搜索（300ms）
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchApprovedList()
  }, 300)
}

// 清空搜索框时立即触发查询
const handleClearSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  currentPage.value = 1
  fetchApprovedList()
}

// 监听分页参数变化
watch([currentPage, pageSize], () => {
  fetchApprovedList()
})

// 查看详情
const handleView = (row) => {
  currentQuotationId.value = row.id
  detailDialogVisible.value = true
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
    fetchApprovedList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchApprovedList()
})
</script>

<style scoped>
.approved-review-container {
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

.pagination-info-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pagination-total {
  font-size: 14px;
  color: #606266;
}

.hint-text {
  color: #909399;
  font-size: 12px;
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
