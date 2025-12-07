<template>
  <div class="cost-records-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>报价单记录</h2>
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
      <!-- 搜索筛选 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model_name" placeholder="请输入型号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已审核" value="approved" />
            <el-option label="已退回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
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
          <el-button type="primary" @click="loadQuotations">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>


      <!-- 数据表格 -->
      <el-table :data="quotations" border v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="quotation_no" label="报价单编号" width="180" />
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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editQuotation(row.id)" v-if="canEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="warning" @click="copyQuotation(row.id)">
              复制
            </el-button>
            <el-button size="small" type="danger" @click="deleteQuotation(row.id)" v-if="canDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadQuotations"
        @current-change="loadQuotations"
        class="pagination"
      />
    </el-card>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, DataAnalysis } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber, formatDateTime } from '@/utils/format'
import { getUser } from '@/utils/auth'
import ProductCategoryModal from '@/components/ProductCategoryModal.vue'

const router = useRouter()

// 产品类别选择弹窗
const categoryModalVisible = ref(false)

// 用户权限
const user = getUser()

// 搜索表单
const searchForm = reactive({
  customer_name: '',
  model_name: '',
  status: '',
  date_range: []
})

const quotations = ref([])
const loading = ref(false)
const selectedQuotations = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 加载报价单列表
const loadQuotations = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      customer_name: searchForm.customer_name,
      model_name: searchForm.model_name,
      status: searchForm.status
    }

    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }

    const res = await request.get('/cost/quotations', { params })
    
    if (res.success) {
      quotations.value = res.data
      pagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('加载报价单列表失败:', error)
    ElMessage.error('加载报价单列表失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.customer_name = ''
  searchForm.model_name = ''
  searchForm.status = ''
  searchForm.date_range = []
  pagination.page = 1
  loadQuotations()
}

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


// 返回
const goBack = () => {
  router.push('/dashboard')
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
      loadQuotations()
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
  loadQuotations()
})
</script>

<style scoped>
.cost-records-container {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
