<template>
  <div class="cost-detail-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>报价单详情</h2>
        </div>
        <div class="header-right">
          <el-button 
            v-if="isAdminOrReviewer && quotation.packaging_config_id" 
            type="success" 
            @click="setAsStandardCost"
            :loading="settingStandardCost"
          >
            设为标准成本
          </el-button>
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
          <el-descriptions-item label="包装方式">
            <span v-if="quotation.packaging_config_name">
              {{ quotation.packaging_config_name }} 
              ({{ quotation.pc_per_bag }}pc/bag, {{ quotation.bags_per_box }}bags/box, {{ quotation.boxes_per_carton }}boxes/carton)
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          
          <el-descriptions-item label="销售类型">
            {{ quotation.sales_type === 'domestic' ? '内销' : '外销' }}
          </el-descriptions-item>
          <el-descriptions-item label="货运方式" v-if="quotation.sales_type === 'export' && quotation.shipping_method">
            {{ quotation.shipping_method === 'fcl_40' ? '40尺整柜' : quotation.shipping_method === 'fcl_20' ? '20尺整柜' : quotation.shipping_method === 'fcl' ? '整柜' : '散货' }}
          </el-descriptions-item>
          <el-descriptions-item label="港口" v-if="quotation.sales_type === 'export' && quotation.port">
            {{ quotation.port }}
          </el-descriptions-item>
          <el-descriptions-item label="购买数量">{{ formatNumber(quotation.quantity, 0) }}</el-descriptions-item>
          <el-descriptions-item label="箱数" v-if="shippingInfo.cartons">{{ shippingInfo.cartons }}</el-descriptions-item>
          <el-descriptions-item label="CBM" v-if="shippingInfo.cbm">{{ shippingInfo.cbm }}</el-descriptions-item>
          <el-descriptions-item label="运费总价">{{ formatNumber(quotation.freight_total) }}</el-descriptions-item>
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
          <el-table-column prop="usage_amount" label="用量" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.usage_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.unit_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.subtotal) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>原料总计：</span>
          <span class="total-value">{{ formatNumber(items.material.total) }}</span>
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
          <el-table-column prop="usage_amount" label="用量" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.usage_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.unit_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.subtotal) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>工序总计：</span>
          <span class="total-value">{{ formatNumber(items.process.total) }}</span>
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
          <el-table-column prop="usage_amount" label="基本用量" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.usage_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.unit_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="carton_volume" label="外箱材积" width="120">
            <template #default="{ row }">
              <span v-if="row.carton_volume">{{ row.carton_volume }}</span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.subtotal) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-row">
          <span>包材总计：</span>
          <span class="total-value">{{ formatNumber(items.packaging.total) }}</span>
        </div>
      </el-card>

      <!-- 成本计算 -->
      <el-card class="info-section">
        <template #header>
          <span class="section-title">成本计算</span>
        </template>
        
        <el-descriptions :column="1" border direction="vertical">
          <el-descriptions-item label="运费成本（每片）">
            {{ formatNumber(quotation.freight_per_unit) }}
          </el-descriptions-item>
          <el-descriptions-item label="基础成本价">
            {{ formatNumber(quotation.base_cost) }}
          </el-descriptions-item>
          <el-descriptions-item label="管销价">
            {{ formatNumber(quotation.overhead_price) }}
          </el-descriptions-item>
          <el-descriptions-item label="运费计入成本">
            {{ quotation.include_freight_in_base ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="汇率（CNY/USD）" v-if="quotation.sales_type === 'export' && calculation">
            {{ formatNumber(calculation.exchangeRate) }}
          </el-descriptions-item>
          <el-descriptions-item :label="quotation.sales_type === 'domestic' ? '最终成本价（含13%增值税）' : '最终成本价（不含增值税）'">
            {{ formatNumber(quotation.final_price) }} {{ quotation.currency }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 利润区间报价表 -->
        <div class="profit-tiers" v-if="calculation && calculation.profitTiers">
          <h4>利润区间报价</h4>
          <el-table :data="allProfitTiers" border style="width: 100%">
            <el-table-column label="利润率" prop="profitPercentage" width="120" />
            <el-table-column label="报价" width="150">
              <template #default="{ row }">
                {{ formatNumber(row.price) }} {{ calculation.currency }}
              </template>
            </el-table-column>
            <el-table-column label="说明">
              <template #default="{ row }">
                <span v-if="!row.isCustom">在基础价格上增加 {{ row.profitPercentage }} 利润</span>
                <span v-else style="color: #E6A23C;">自定义利润档位</span>
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
import { formatNumber } from '@/utils/format'
import { useConfigStore } from '@/store/config'
import { getUser } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()

const quotation = ref({})
const items = ref({
  material: { items: [], total: 0 },
  process: { items: [], total: 0 },
  packaging: { items: [], total: 0 }
})
const calculation = ref(null)
const loading = ref(false)
const settingStandardCost = ref(false)

// 用户权限
const user = getUser()
const isAdminOrReviewer = computed(() => {
  return user && (user.role === 'admin' || user.role === 'reviewer')
})

// 自定义利润档位
const customProfitTiers = ref([])

// 货运信息（箱数和CBM）
const shippingInfo = reactive({
  cartons: null,
  cbm: null
})

// 是否可以编辑
const canEdit = computed(() => {
  return quotation.value.status === 'draft' || quotation.value.status === 'rejected'
})

// 合并系统利润档位和自定义档位，并按百分比排序
const allProfitTiers = computed(() => {
  if (!calculation.value || !calculation.value.profitTiers) {
    return []
  }
  
  // 系统档位
  const systemTiers = calculation.value.profitTiers.map(tier => ({
    ...tier,
    isCustom: false
  }))
  
  // 自定义档位
  const customTiers = customProfitTiers.value.map(tier => ({
    ...tier,
    isCustom: true
  }))
  
  // 合并并排序
  const allTiers = [...systemTiers, ...customTiers]
  allTiers.sort((a, b) => a.profitRate - b.profitRate)
  
  return allTiers
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
      
      // 加载自定义利润档位
      if (quotation.value.custom_profit_tiers) {
        try {
          customProfitTiers.value = JSON.parse(quotation.value.custom_profit_tiers)
        } catch (e) {
          console.error('解析自定义利润档位失败:', e)
          customProfitTiers.value = []
        }
      }
      
      // 计算箱数和CBM
      calculateShippingInfo()
    }
  } catch (error) {
    console.error('加载详情失败:', error)
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

// 计算箱数和CBM
const calculateShippingInfo = () => {
  // 重置
  shippingInfo.cartons = null
  shippingInfo.cbm = null
  
  // 检查必要条件
  if (!quotation.value.quantity || quotation.value.quantity <= 0) {
    return
  }
  
  if (!quotation.value.pc_per_bag || !quotation.value.bags_per_box || !quotation.value.boxes_per_carton) {
    return
  }
  
  // 计算每箱只数
  const pcsPerCarton = quotation.value.pc_per_bag * quotation.value.bags_per_box * quotation.value.boxes_per_carton
  
  if (pcsPerCarton <= 0) {
    return
  }
  
  // 计算箱数
  const cartons = Math.ceil(quotation.value.quantity / pcsPerCarton)
  shippingInfo.cartons = cartons
  
  // 计算CBM（需要从包材中获取外箱材积）
  const cartonMaterial = items.value.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
  
  if (cartonMaterial && cartonMaterial.carton_volume > 0) {
    // 总材积 = 外箱材积 * 箱数
    const totalVolume = cartonMaterial.carton_volume * cartons
    // CBM = 总材积 / 35.32（保留一位小数）
    const cbm = (totalVolume / 35.32).toFixed(1)
    shippingInfo.cbm = cbm
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

// 设为标准成本
const setAsStandardCost = async () => {
  if (!quotation.value.packaging_config_id) {
    ElMessage.warning('该报价单没有关联包装配置，无法设为标准成本')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要将此报价单设为标准成本吗？如果该包装配置已有标准成本，将创建新版本。',
      '设为标准成本',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    settingStandardCost.value = true
    
    const res = await request.post('/standard-costs', {
      quotation_id: quotation.value.id
    })
    
    if (res.success) {
      ElMessage.success('已成功设为标准成本')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('设为标准成本失败:', error)
      ElMessage.error(error.response?.data?.message || '设为标准成本失败')
    }
  } finally {
    settingStandardCost.value = false
  }
}

onMounted(async () => {
  await configStore.loadConfig()
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

.custom-profit-section {
  margin-top: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.custom-profit-section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
}

.custom-profit-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-profit-input .label {
  font-weight: 500;
  color: #606266;
}

.custom-profit-input .unit {
  color: #909399;
  font-size: 13px;
}

.custom-profit-input .result {
  margin-left: 20px;
  color: #606266;
}

.custom-profit-input .result strong {
  color: #67c23a;
  font-size: 16px;
}
</style>
