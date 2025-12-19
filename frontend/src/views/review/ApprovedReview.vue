<template>
  <div class="approved-review-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2>📋 已审核记录</h2>
        </div>
      </div>
    </el-card>

    <el-card>
      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已通过" value="approved" />
            <el-option label="已退回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model_name" placeholder="请输入型号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="审核日期">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="approvedList" border v-loading="loading" style="width: 100%">
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
        <el-table-column prop="quantity" label="数量" width="100">
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
      <div class="pagination-container">
        <div class="pagination-info">
          <span class="total-text">共 {{ pagination.total }} 条记录</span>
          <span class="hint-text">💡 此列表显示已通过和已退回的报价单</span>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
import ApprovedDetailDialog from '@/components/review/ApprovedDetailDialog.vue'

const reviewStore = useReviewStore()
const authStore = useAuthStore()

// 搜索表单
const searchForm = ref({
  status: '',
  customer_name: '',
  model_name: '',
  date_range: []
})

// 弹窗状态
const detailDialogVisible = ref(false)
const currentQuotationId = ref(null)

// 计算属性
const loading = computed(() => reviewStore.loading)
const approvedList = computed(() => reviewStore.approvedList)
const pagination = computed(() => reviewStore.approvedPagination)
const isAdmin = computed(() => authStore.user?.role === 'admin')

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

// 加载数据
const loadData = async () => {
  try {
    await reviewStore.fetchApprovedList({
      ...searchForm.value,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

// 搜索
const handleSearch = () => {
  reviewStore.approvedPagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    status: '',
    customer_name: '',
    model_name: '',
    date_range: []
  }
  reviewStore.resetApprovedSearchParams()
  loadData()
}

// 分页
const handleSizeChange = (size) => {
  reviewStore.approvedPagination.pageSize = size
  reviewStore.approvedPagination.page = 1
  loadData()
}

const handlePageChange = (page) => {
  reviewStore.approvedPagination.page = page
  loadData()
}

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
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadData()
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

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.total-text {
  color: #606266;
  font-size: 14px;
}

.hint-text {
  color: #909399;
  font-size: 12px;
}
</style>
