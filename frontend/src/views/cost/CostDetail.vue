<template>
  <div class="cost-detail-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>报价单详情</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="goToEdit" v-if="canEdit">编辑</el-button>
          <el-button type="warning" @click="copyQuotation">复制</el-button>
        </div>
      </div>
    </el-card>

    <div v-loading="loading">
      <!-- 基本信息 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        
        <el-descriptions :column="3" border>
          <el-descriptions-item label="报价单编号">{{ quotation.quotation_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(quotation.status)">
              {{ getStatusText(quotation.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ quotation.creator_name }}</el-descriptions-item>
          
          <el-descriptions-item label="客户名称">{{ quotation.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="客户地区">{{ quotation.customer_region }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ quotation.model_name }}</el-descriptions-item>
          
          <el-descriptions-item label="销售类型">
            {{ quotation.sales_type === 'domestic' ? '内销' : '外销' }}
          </el-descriptions-item>
          <el-descriptions-item label="购买数量">{{ quotation.quantity }}</el-descriptions-item>
          <el-descriptions-item label="运费总价">{{ quotation.freight_total?.toFixed(4) }}</el-descriptions-item>
          
          <el-descriptions-item label="创建时间">{{ quotation.created_at }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ quotation.submitted_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ quotation.reviewed_at || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 原料明细 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">原料明细</span>
        </template>
        
        <el-table :data="items.material.items" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="item_name" label="原料名称" />
          <el-table-column prop="usage_amount" label="用量" width="120" />
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ row.unit_price?.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ row.subtotal?.toFixed(4) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>原料总计：</span>
          <span class="total-value">{{ items.material.total?.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 工序明细 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">工序明细</span>
        </template>
        
        <el-table :data="items.process.items" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="item_name" label="工序名称" />
          <el-table-column prop="usage_amount" label="用量" width="120" />
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ row.unit_price?.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ row.subtotal?.toFixed(4) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>工序小计：</span>
          <span class="total-value">{{ (items.process.total / 1.56)?.toFixed(4) }}</span>
        </div>
        <div class="total-row">
          <span>工序总计（含1.56系数）：</span>
          <span class="total-value">{{ items.process.total?.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 包材明细 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">包材明细</span>
        </template>
        
        <el-table :data="items.packaging.items" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="item_name" label="包材名称" />
          <el-table-column prop="usage_amount" label="基本用量" width="120" />
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ row.unit_price?.toFixed(4) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ row.subtotal?.toFixed(4) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>包材总计：</span>
          <span class="total-value">{{ items.packaging.total?.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 成本计算 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">成本计算</span>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="运费成本（每片）">
            {{ quotation.freight_per_unit?.toFixed(4) }}
          </el-descriptions-item>
          <el-descriptions-item label="基础成本价">
            {{ quotation.base_cost?.toFixed(4) }}
          </el-descriptions-item>
          <el-descriptions-item label="管销价">
            {{ quotation.overhead_price?.toFixed(4) }}
          </el-descriptions-item>
          <el-descriptions-item label="运费计入成本">
            {{ quotation.include_freight_in_base ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item :label="quotation.sales_type === 'domestic' ? '最终成本价（含13%增值税）' : '最终成本价（不含增值税）'">
            {{ quotation.final_price?.toFixed(4) }} {{ quotation.currency }}
          </el-descriptions-item>
          <el-descriptions-item label="汇率（CNY/USD）" v-if="quotation.sales_type === 'export' && calculation">
            {{ calculation.exchangeRate || '7.2000' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 利润区间报价表 -->
        <div class="profit-tiers" v-if="calculation && calculation.profitTiers">
          <h4>利润区间报价</h4>
          <el-table :data="calculation.profitTiers" border style="width: 100%">
            <el-table-column label="利润率" prop="profitPercentage" width="120" />
            <el-table-column label="报价" width="150">
              <template #default="{ row }">
                {{ row.price.toFixed(4) }} {{ calculation.currency }}
              </template>
            </el-table-column>
            <el-table-column label="说明">
              <template #default="{ row }">
                在基础价格上增加 {{ row.profitPercentage }} 利润
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const quotation = ref({})
const items = ref({
  material: { items: [], total: 0 },
  process: { items: [], total: 0 },
  packaging: { items: [], total: 0 }
})
const calculation = ref(null)
const loading = ref(false)

// 是否可以编辑
const canEdit = computed(() => {
  return quotation.value.status === 'draft' || quotation.value.status === 'rejected'
})

// 加载报价单详情
const loadDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/cost/quotations/${route.params.id}`)
    
    console.log('详情接口返回:', res)
    
    if (res.success) {
      quotation.value = res.data.quotation
      items.value = res.data.items
      calculation.value = res.data.calculation
      
      console.log('报价单数据:', quotation.value)
      console.log('明细数据:', items.value)
      console.log('计算数据:', calculation.value)
    }
  } catch (error) {
    console.error('加载详情失败:', error)
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
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
  router.back()
}

// 编辑
const goToEdit = () => {
  router.push(`/cost/edit/${route.params.id}`)
}

// 复制
const copyQuotation = () => {
  router.push({
    path: '/cost/add',
    query: { copyFrom: route.params.id }
  })
  ElMessage.success('正在复制报价单...')
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.cost-detail-container {
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

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 10px;
}

.info-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.total-row {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
}

.total-value {
  color: #409eff;
  margin-left: 10px;
}

.profit-tiers {
  margin-top: 20px;
}

.profit-tiers h4 {
  margin-bottom: 10px;
  color: #303133;
}
</style>
