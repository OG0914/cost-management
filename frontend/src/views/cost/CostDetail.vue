<template>
  <div class="cost-detail-container">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </div>
      <div class="header-center">
        <h2>报价单详情</h2>
        <el-tag :type="getStatusType(quotation.status)" size="large" style="margin-left: 12px;">
          {{ getStatusText(quotation.status) }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button type="warning" @click="profitDialogVisible = true">
          <el-icon><TrendCharts /></el-icon>
          利润落点
        </el-button>
        <el-button 
          v-if="isAdminOrReviewer && quotation.packaging_config_id && quotation.status === 'approved'" 
          type="success" 
          @click="setAsStandardCost"
          :loading="settingStandardCost"
        >
          设为标准成本
        </el-button>
        <el-button type="primary" @click="goToEdit" v-if="canEdit">编辑</el-button>
        <el-button @click="copyQuotation">复制</el-button>
      </div>
    </div>

    <div v-loading="loading">
      <!-- 基本信息 -->
      <el-card class="form-section" shadow="hover">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>

        <el-row :gutter="24">
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">报价单编号</span>
              <span class="info-value">{{ quotation.quotation_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">客户名称</span>
              <span class="info-value">{{ quotation.customer_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">客户地区</span>
              <span class="info-value">{{ quotation.customer_region }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">型号</span>
              <span class="info-value">{{ quotation.model_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">包装方式</span>
              <span class="info-value" v-if="quotation.packaging_config_name">
                {{ quotation.packaging_config_name }} 
                ({{ quotation.pc_per_bag }}片/袋, {{ quotation.bags_per_box }}袋/盒, {{ quotation.boxes_per_carton }}盒/箱)
              </span>
              <span class="info-value text-muted" v-else>-</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">创建人</span>
              <span class="info-value">{{ quotation.creator_name }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 销售类型展示 -->
      <el-card class="form-section" shadow="hover">
        <template #header>
          <span class="section-title">销售类型</span>
        </template>

        <div class="sales-type-display">
          <div class="sales-card" :class="{ active: quotation.sales_type === 'domestic' }">
            <div class="sales-card-title">内销</div>
            <div class="sales-card-desc">币种: 人民币 (CNY)</div>
            <div class="sales-card-desc">含 {{ ((quotation.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</div>
          </div>
          <div class="sales-card" :class="{ active: quotation.sales_type === 'export' }">
            <div class="sales-card-title">外销</div>
            <div class="sales-card-desc">币种: 美元 (USD)</div>
            <div class="sales-card-desc">FOB 条款 / 0% 税率</div>
          </div>
        </div>

        <!-- 外销运费信息 -->
        <div v-if="quotation.sales_type === 'export'" class="export-info-section">
          <el-row :gutter="24">
            <el-col :span="6" v-if="quotation.shipping_method">
              <div class="info-item">
                <span class="info-label">货柜类型</span>
                <span class="info-value">{{ quotation.shipping_method === 'fcl_40' ? '40GP 大柜' : quotation.shipping_method === 'fcl_20' ? '20GP 小柜' : 'LCL 散货' }}</span>
              </div>
            </el-col>
            <el-col :span="6" v-if="quotation.port">
              <div class="info-item">
                <span class="info-label">港口</span>
                <span class="info-value">{{ quotation.port }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="info-item">
                <span class="info-label">订购数量</span>
                <span class="info-value">{{ formatQuantity(quotation.quantity) }}</span>
              </div>
            </el-col>
            <el-col :span="3" v-if="shippingInfo.cartons">
              <div class="info-item">
                <span class="info-label">箱数</span>
                <span class="info-value">{{ shippingInfo.cartons }}</span>
              </div>
            </el-col>
            <el-col :span="3" v-if="shippingInfo.cbm">
              <div class="info-item">
                <span class="info-label">CBM</span>
                <span class="info-value">{{ shippingInfo.cbm }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="24" v-if="quotation.freight_total">
            <el-col :span="6">
              <div class="info-item">
                <span class="info-label">运费总价</span>
                <span class="info-value highlight-blue">¥{{ formatNumber(quotation.freight_total) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="info-item">
                <span class="info-label">运费计入成本</span>
                <span class="info-value">{{ quotation.include_freight_in_base ? '是' : '否' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 内销数量信息 -->
        <div v-if="quotation.sales_type === 'domestic'" class="domestic-info-section">
          <el-row :gutter="24">
            <el-col :span="6">
              <div class="info-item">
                <span class="info-label">购买数量</span>
                <span class="info-value">{{ formatQuantity(quotation.quantity) }}</span>
              </div>
            </el-col>
            <el-col :span="3" v-if="shippingInfo.cartons">
              <div class="info-item">
                <span class="info-label">箱数</span>
                <span class="info-value">{{ shippingInfo.cartons }}</span>
              </div>
            </el-col>
            <el-col :span="3" v-if="shippingInfo.cbm">
              <div class="info-item">
                <span class="info-label">CBM</span>
                <span class="info-value">{{ shippingInfo.cbm }}</span>
              </div>
            </el-col>
            <el-col :span="6" v-if="quotation.freight_total">
              <div class="info-item">
                <span class="info-label">运费总价</span>
                <span class="info-value">¥{{ formatNumber(quotation.freight_total) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="info-item">
                <span class="info-label">运费计入成本</span>
                <span class="info-value">{{ quotation.include_freight_in_base ? '是' : '否' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 完整视图：成本明细（仅管理员/审核人可见） -->
      <el-card class="form-section" shadow="hover" v-if="isFullView">
        <template #header>
          <span class="section-title">成本明细</span>
        </template>

        <!-- 原料明细 -->
        <div class="cost-detail-section">
          <div class="detail-header">
            <span class="detail-title">原料明细</span>
          </div>

          <el-table :data="items.material.items" border size="small" class="detail-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="item_name" label="原料名称" min-width="180" />
            <el-table-column label="基本用量" width="100">
              <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
            </el-table-column>
            <el-table-column label="单价(CNY)" width="100">
              <template #default="{ row }">{{ formatNumber(row.unit_price) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
            </el-table-column>
          </el-table>

          <div class="subtotal-row">
            <span>∑ 原料小计: <strong>{{ formatNumber(items.material.total) }}</strong></span>
          </div>
        </div>

        <!-- 工序明细 -->
        <div class="cost-detail-section">
          <div class="detail-header">
            <span class="detail-title">工序明细</span>
          </div>

          <el-table :data="items.process.items" border size="small" class="detail-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="item_name" label="工序名称" min-width="150" />
            <el-table-column label="基本用量" width="100">
              <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
            </el-table-column>
            <el-table-column label="工价(CNY)" width="100">
              <template #default="{ row }">{{ formatNumber(row.unit_price) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
            </el-table-column>
          </el-table>

          <div class="subtotal-row">
            <span>∑ 工序小计: <strong>{{ formatNumber(items.process.total) }}</strong></span>
            <span class="process-total">工价系数({{ configStore.config.process_coefficient || 1.56 }}): <strong class="highlight">{{ formatNumber(items.process.total * (configStore.config.process_coefficient || 1.56)) }}</strong></span>
          </div>
        </div>

        <!-- 包材明细 -->
        <div class="cost-detail-section">
          <div class="detail-header">
            <span class="detail-title">包材明细</span>
          </div>

          <el-table :data="items.packaging.items" border size="small" class="detail-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="item_name" label="包材名称" min-width="180" />
            <el-table-column label="基本用量" width="100">
              <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
            </el-table-column>
            <el-table-column label="单价(CNY)" width="100">
              <template #default="{ row }">{{ formatNumber(row.unit_price) }}</template>
            </el-table-column>
            <el-table-column label="外箱材积" width="100">
              <template #default="{ row }">
                <span v-if="row.carton_volume">{{ row.carton_volume }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
            </el-table-column>
          </el-table>

          <div class="subtotal-row">
            <span>∑ 包材小计: <strong>{{ formatNumber(items.packaging.total) }}</strong></span>
          </div>
        </div>
      </el-card>

      <!-- 简略视图：成本构成比例（业务员/只读用户可见） -->
      <el-card class="form-section" shadow="hover" v-else>
        <template #header>
          <span class="section-title">成本构成</span>
        </template>

        <div class="cost-cards">
          <div class="cost-card">
            <div class="cost-card-label">原料成本</div>
            <div class="cost-card-value">{{ formatNumber(items.material.total) }} CNY</div>
            <div class="cost-percent">({{ costPercentage.material }}%)</div>
          </div>
          <div class="cost-card">
            <div class="cost-card-label">工序成本</div>
            <div class="cost-card-value">{{ formatNumber(items.process.total * (configStore.config.process_coefficient || 1.56)) }} CNY</div>
            <div class="cost-percent">({{ costPercentage.process }}%)</div>
          </div>
          <div class="cost-card">
            <div class="cost-card-label">包材成本</div>
            <div class="cost-card-value">{{ formatNumber(items.packaging.total) }} CNY</div>
            <div class="cost-percent">({{ costPercentage.packaging }}%)</div>
          </div>
          <div class="cost-card">
            <div class="cost-card-label">运费成本</div>
            <div class="cost-card-value">{{ formatNumber(quotation.freight_per_unit || 0) }} CNY</div>
            <div class="cost-percent">({{ costPercentage.freight }}%)</div>
          </div>
        </div>

        <div class="simple-view-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>如需提交审核或查看成本明细，请前往编辑界面。</span>
        </div>
      </el-card>

      <!-- 成本计算 -->
      <el-card class="form-section" shadow="hover">
        <template #header>
          <div class="section-header">
            <span class="section-title">成本计算</span>
            <el-button type="primary" size="small" link @click="showFormula = !showFormula">
              <el-icon><View v-if="!showFormula" /><Hide v-else /></el-icon>
              {{ showFormula ? '隐藏公式' : '显示公式' }}
            </el-button>
          </div>
        </template>

        <!-- 成本卡片展示 -->
        <div class="cost-cards">
          <div class="cost-card">
            <div class="cost-card-label">基础成本价</div>
            <div class="cost-card-value">{{ formatNumber(quotation.base_cost) }} CNY</div>
            <div v-if="showFormula" class="formula-text">
              = 原料{{ formatNumber(items.material.total) }} + 工序{{ formatNumber(items.process.total) }}×{{ configStore.config.process_coefficient || 1.56 }} + 包材{{ formatNumber(items.packaging.total) }}{{ quotation.include_freight_in_base ? ' + 运费' + formatNumber(quotation.freight_per_unit) : '' }}
            </div>
          </div>
          <div class="cost-card">
            <div class="cost-card-label">运费成本（每片）</div>
            <div class="cost-card-value">{{ formatNumber(quotation.freight_per_unit) }} CNY</div>
          </div>
          <div class="cost-card">
            <div class="cost-card-label">管销价</div>
            <div class="cost-card-value">{{ formatNumber(quotation.overhead_price) }} CNY</div>
            <div v-if="showFormula" class="formula-text">
              = {{ formatNumber(quotation.base_cost) }} ÷ (1 - {{ ((configStore.config.overhead_rate || 0.2) * 100).toFixed(0) }}%)
            </div>
          </div>
        </div>

        <!-- 最终成本价 -->
        <div class="final-cost-box">
          <div class="final-cost-label">最终成本价</div>
          <div class="final-cost-value">{{ formatNumber(quotation.final_price) }} {{ quotation.currency }}</div>
          <div class="final-cost-info">
            <span v-if="quotation.sales_type === 'export'">汇率: {{ formatNumber(calculation?.exchangeRate || 7.2) }} | 保险: 0.3%</span>
            <span v-else>含 {{ ((quotation.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</span>
          </div>
          <div v-if="showFormula" class="formula-text" style="margin-top: 8px;">
            <template v-if="quotation.sales_type === 'domestic'">
              = {{ formatNumber(quotation.overhead_price) }} × (1 + {{ ((quotation.vat_rate || 0.13) * 100).toFixed(0) }}%)
            </template>
            <template v-else>
              = {{ formatNumber(quotation.overhead_price) }} ÷ {{ formatNumber(calculation?.exchangeRate || 7.2) }} × 1.003
            </template>
          </div>
        </div>
      </el-card>

      <!-- 利润区间 -->
      <el-card class="form-section" shadow="hover" v-if="calculation && calculation.profitTiers">
        <template #header>
          <span class="section-title">利润区间</span>
        </template>

        <div class="profit-tier-cards">
          <div v-for="tier in allProfitTiers" :key="tier.isCustom ? 'custom-' + tier.profitRate : 'system-' + tier.profitRate" class="profit-card" :class="{ custom: tier.isCustom }">
            <div class="profit-label">{{ tier.profitPercentage }} 利润</div>
            <div class="profit-price">{{ formatNumber(tier.price) }} {{ calculation.currency }}</div>
            <div v-if="tier.isCustom" class="custom-tag">自定义</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 利润计算器弹窗 -->
    <ProfitCalculatorDialog 
      v-model="profitDialogVisible" 
      :initial-cost-price="parseFloat(quotation.final_price) || 0"
      :initial-quantity="quotation.quantity || 0"
      :currency="quotation.currency || 'CNY'"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, InfoFilled, View, Hide, TrendCharts } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import { formatQuantity } from '@/utils/review'
import { useConfigStore } from '@/store/config'
import { getUser } from '@/utils/auth'
import ProfitCalculatorDialog from '@/components/ProfitCalculatorDialog.vue'

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
const showFormula = ref(false)
const profitDialogVisible = ref(false)

// 用户权限
const user = getUser()
const isAdminOrReviewer = computed(() => {
  return user && (user.role === 'admin' || user.role === 'reviewer')
})

// 视图模式：完整视图(admin/reviewer) vs 简略视图(salesperson/readonly)
const isFullView = computed(() => {
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

// 成本构成百分比（简略视图用）
const costPercentage = computed(() => {
  const material = parseFloat(items.value.material.total) || 0
  const process = (parseFloat(items.value.process.total) || 0) * (configStore.config.process_coefficient || 1.56)
  const packaging = parseFloat(items.value.packaging.total) || 0
  const freight = parseFloat(quotation.value.freight_per_unit) || 0
  const total = material + process + packaging + freight
  
  if (total === 0) {
    return { material: '0.0', process: '0.0', packaging: '0.0', freight: '0.0' }
  }
  
  return {
    material: ((material / total) * 100).toFixed(1),
    process: ((process / total) * 100).toFixed(1),
    packaging: ((packaging / total) * 100).toFixed(1),
    freight: ((freight / total) * 100).toFixed(1)
  }
})

// 合并系统利润档位和自定义档位
const allProfitTiers = computed(() => {
  if (!calculation.value || !calculation.value.profitTiers) return []
  
  const systemTiers = calculation.value.profitTiers.map(tier => ({ ...tier, isCustom: false }))
  const customTiers = customProfitTiers.value.map(tier => ({ ...tier, isCustom: true }))
  const allTiers = [...systemTiers, ...customTiers]
  allTiers.sort((a, b) => a.profitRate - b.profitRate)
  
  return allTiers
})

// 返回
const goBack = () => {
  router.back()
}

// 加载报价单详情
const loadDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/cost/quotations/${route.params.id}`)
    
    if (res.success) {
      quotation.value = res.data.quotation
      items.value = res.data.items
      calculation.value = res.data.calculation
      
      // 加载自定义利润档位
      if (quotation.value.custom_profit_tiers) {
        try {
          customProfitTiers.value = JSON.parse(quotation.value.custom_profit_tiers)
        } catch (e) {
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
  shippingInfo.cartons = null
  shippingInfo.cbm = null
  
  if (!quotation.value.quantity || quotation.value.quantity <= 0) return
  if (!quotation.value.pc_per_bag || !quotation.value.bags_per_box || !quotation.value.boxes_per_carton) return
  
  const pcsPerCarton = quotation.value.pc_per_bag * quotation.value.bags_per_box * quotation.value.boxes_per_carton
  if (pcsPerCarton <= 0) return
  
  const cartons = Math.ceil(quotation.value.quantity / pcsPerCarton)
  shippingInfo.cartons = cartons
  
  const cartonMaterial = items.value.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
  if (cartonMaterial && cartonMaterial.carton_volume > 0) {
    const totalVolume = cartonMaterial.carton_volume * cartons
    shippingInfo.cbm = (totalVolume / 35.32).toFixed(1)
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = { draft: 'info', submitted: 'warning', approved: 'success', rejected: 'danger' }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = { draft: '草稿', submitted: '已提交', approved: '已审核', rejected: '已退回' }
  return textMap[status] || status
}

// 编辑
const goToEdit = () => {
  router.push(`/cost/edit/${route.params.id}`)
}

// 复制
const copyQuotation = () => {
  router.push({ path: '/cost/add', query: { copyFrom: route.params.id } })
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
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    
    settingStandardCost.value = true
    
    const res = await request.post('/standard-costs', { quotation_id: quotation.value.id })
    
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
.cost-detail-container { padding: 0; }

/* 顶部导航栏 */
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #fff; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.page-header .header-left { display: flex; align-items: center; }
.page-header .header-center { display: flex; align-items: center; }
.page-header .header-center h2 { margin: 0; font-size: 20px; color: #303133; }
.page-header .header-right { display: flex; align-items: center; gap: 12px; }
.page-header .back-btn { font-size: 14px; color: #606266; }

/* 表单区块 */
.form-section { margin-bottom: 16px; border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; }
.section-header { display: flex; justify-content: space-between; align-items: center; }

/* 信息项 */
.info-item { margin-bottom: 16px; }
.info-label { display: block; font-size: 13px; color: #909399; margin-bottom: 4px; }
.info-value { font-size: 14px; color: #303133; font-weight: 500; }
.text-muted { color: #909399; }

/* 销售类型展示 */
.sales-type-display { display: flex; gap: 20px; margin-bottom: 20px; }
.sales-card { flex: 1; padding: 20px; border: 2px solid #e4e7ed; border-radius: 8px; text-align: center; opacity: 0.5; transition: all 0.3s; }
.sales-card.active { border-color: #409eff; background: #ecf5ff; opacity: 1; }
.sales-card-title { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.sales-card-desc { font-size: 13px; color: #909399; line-height: 1.6; }


/* 内销数量信息 */
.domestic-info-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }

/* 外销信息区域 */
.export-info-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }

/* 高亮蓝色 */
.highlight-blue { color: #409eff; font-weight: 600; }

/* 成本明细区块 */
.cost-detail-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ebeef5; }
.cost-detail-section:last-child { border-bottom: none; margin-bottom: 0; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.detail-title { font-size: 14px; font-weight: 600; color: #606266; }
.detail-table { margin-bottom: 8px; }

/* 小计行 */
.subtotal-row { display: flex; justify-content: flex-end; gap: 24px; padding: 8px 0; font-size: 14px; color: #606266; }
.subtotal-row strong { color: #409eff; }
.subtotal-row .process-total .highlight { color: #67c23a; }

/* 成本卡片 */
.cost-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.cost-card { flex: 1; min-width: 180px; padding: 16px; background: #f5f7fa; border-radius: 8px; text-align: center; }
.cost-card-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.cost-card-value { font-size: 18px; font-weight: 600; color: #303133; }
.cost-percent { font-size: 12px; color: #909399; margin-top: 4px; }

/* 简略视图提示 */
.simple-view-hint { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdf6ec; border-radius: 4px; color: #e6a23c; font-size: 13px; }

/* 公式文本 */
.formula-text { font-size: 12px; color: #909399; font-style: italic; margin-top: 4px; }

/* 最终成本价 */
.final-cost-box { background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%); border-radius: 8px; padding: 20px; text-align: center; color: #fff; }
.final-cost-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.final-cost-value { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.final-cost-info { font-size: 12px; opacity: 0.8; }

/* 利润区间卡片 */
.profit-tier-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.profit-card { flex: 1; min-width: 120px; padding: 16px; border: 1px solid #e4e7ed; border-radius: 8px; text-align: center; position: relative; }
.profit-card.custom { border-color: #e6a23c; background: #fdf6ec; }
.profit-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.profit-price { font-size: 18px; font-weight: 600; color: #303133; }
.custom-tag { position: absolute; top: 4px; right: 4px; font-size: 10px; color: #e6a23c; background: #fdf6ec; padding: 2px 6px; border-radius: 4px; }
</style>
