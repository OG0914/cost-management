<template>
  <el-dialog
    :model-value="modelValue"
    title="报价单详情"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    destroy-on-close
    append-to-body
    class="review-dialog"
  >
    <div v-loading="loading" class="review-detail-content">
      <template v-if="quotationDetail">
        <!-- 顶部核心标题 -->
        <div class="review-header">
          <span class="review-quotation-no">{{ quotationDetail.quotation_no }}</span>
          <StatusBadge type="status" :value="quotationDetail.status" />
          <StatusBadge type="sales_type" :value="quotationDetail.sales_type" />
          
          <div class="flex-grow"></div>
          <el-button type="primary" size="small" icon="Download" @click="handleExport" plain>导出 Excel</el-button>
        </div>

        <!-- 详细信息网格 -->
        <div class="review-info-grid">
          <div class="review-info-card">
            <div class="review-info-label">客户名称</div>
            <div class="review-info-value">{{ quotationDetail.customer_name }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">客户地区</div>
            <div class="review-info-value">{{ quotationDetail.customer_region || '-' }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">法规类别</div>
            <div class="review-info-value">{{ quotationDetail.regulation_name || '-' }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">产品数量</div>
            <div class="review-info-value">{{ formatQuantity(quotationDetail.quantity) }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">产品型号</div>
            <div class="review-info-value">{{ quotationDetail.model_name }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">包装配置</div>
            <div class="review-info-value">
              <div class="text-ellipsis" :title="quotationDetail.packaging_config_name">
                {{ quotationDetail.packaging_config_name || '-' }}
              </div>
              <div class="review-info-sub" :title="formatPackagingSpec(quotationDetail)">
                {{ formatPackagingSpec(quotationDetail) }}
              </div>
            </div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">创建人</div>
            <div class="review-info-value">{{ quotationDetail.creator_name }}</div>
          </div>
          <div class="review-info-card">
            <div class="review-info-label">提交时间</div>
            <div class="review-info-value">{{ formatDateTime(quotationDetail.submitted_at).split(' ')[0] }}</div>
          </div>
        </div>

        <!-- 成本构成 (摘要) -->
        <div class="review-section">
          <div class="review-section-title">成本构成</div>
          <div class="cost-composition-grid">
            <div class="comp-item material">
               <div class="comp-label">原料成本</div>
               <div class="comp-value">¥{{ formatNumber(costComposition.material, 4) }}</div>
               <div class="comp-percent">{{ costComposition.materialPercent.toFixed(1) }}%</div>
            </div>
            <div class="comp-item process">
               <div class="comp-label">工序成本</div>
               <div class="comp-value">¥{{ formatNumber(costComposition.process, 4) }}</div>
               <div class="comp-percent">{{ costComposition.processPercent.toFixed(1) }}%</div>
            </div>
            <div class="comp-item packaging">
               <div class="comp-label">包材成本</div>
               <div class="comp-value">¥{{ formatNumber(costComposition.packaging, 4) }}</div>
               <div class="comp-percent">{{ costComposition.packagingPercent.toFixed(1) }}%</div>
            </div>
            <div class="comp-item shipping">
               <div class="comp-label">运费/片</div>
               <div class="comp-value">¥{{ formatNumber(costComposition.shipping, 4) }}</div>
               <div class="comp-percent">{{ costComposition.shippingPercent.toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- 详细选项卡 -->
        <div class="review-section">
          <div class="review-section-title">成本明细</div>
          <el-tabs v-model="activeTab" class="cost-tabs">
            <el-tab-pane label="原料" name="material">
              <div class="review-table-container">
                <el-table :data="materialItems" border size="small">
                  <el-table-column prop="item_name" label="原料名称" min-width="140" />
                  <el-table-column prop="usage_amount" label="用量" width="90">
                    <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_price" label="单价" width="90">
                    <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                  </el-table-column>
                  <el-table-column prop="subtotal" label="小计" width="90">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="review-subtotal-bar">
                <span>原料小计: <strong class="highlight">{{ formatNumber(materialSubtotal) }}</strong> 元</span>
              </div>
            </el-tab-pane>
            <el-tab-pane label="工序" name="process">
              <div class="review-table-container">
                <el-table :data="processItems" border size="small">
                  <el-table-column prop="item_name" label="工序名称" min-width="140" />
                  <el-table-column prop="usage_amount" label="用量" width="90">
                    <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_price" label="单价" width="90">
                    <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                  </el-table-column>
                  <el-table-column prop="subtotal" label="小计" width="90">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="review-subtotal-bar">
                <span>工序小计: <strong class="highlight">{{ formatNumber(processSubtotal) }}</strong> 元</span>
              </div>
            </el-tab-pane>
            <el-tab-pane label="包材" name="packaging">
              <div class="review-table-container">
                <el-table :data="packagingItems" border size="small">
                  <el-table-column prop="item_name" label="包材名称" min-width="140" />
                  <el-table-column prop="usage_amount" label="用量" width="90">
                    <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_price" label="单价" width="90">
                    <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                  </el-table-column>
                  <el-table-column prop="subtotal" label="小计" width="90">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="review-subtotal-bar">
                <span>包材小计: <strong class="highlight">{{ formatNumber(packagingSubtotal) }}</strong> 元</span>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 价格汇总 -->
        <div class="review-section">
          <div class="review-section-title">价格与利润</div>
          <div class="review-pricing-panel">
            <div class="review-pricing-header">
              <div class="review-pricing-info">
                <div class="review-pricing-label">基础成本</div>
                <div class="review-pricing-value">{{ formatNumber(quotationDetail.base_cost) }}</div>
              </div>
              <div class="review-pricing-divider"></div>
              <div class="review-pricing-info">
                <div class="review-pricing-label">管销费用</div>
                <div class="review-pricing-value">{{ formatNumber(quotationDetail.overhead_price) }}</div>
              </div>
              <div class="review-pricing-divider"></div>
              <div class="review-pricing-info final">
                <div class="review-pricing-label">{{ quotationDetail.sales_type === 'export' ? '外销最终价' : '内销最终价' }}</div>
                <div class="review-pricing-final">
                  <span class="currency">{{ quotationDetail.currency }}</span>
                  <span class="amount">{{ formatNumber(quotationDetail.final_price) }}</span>
                </div>
              </div>
            </div>
            <div class="review-profit-section">
              <div class="review-profit-header">
                <span class="review-profit-title">建议利润区间</span>
              </div>
              <div class="review-profit-table-wrapper">
                <table class="review-profit-table">
                  <thead>
                    <tr><th class="col-rate">利润率</th><th class="col-price">售价</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in profitPricing" :key="item.rate" :class="{ 'custom-tier': item.isCustom }">
                      <td class="col-rate">
                        <span class="rate-badge" :class="{ custom: item.isCustom }">{{ item.rate }}%</span>
                      </td>
                      <td class="col-price">
                        <span class="price-value">{{ formatNumber(item.price) }}</span>
                        <span class="price-unit">{{ quotationDetail.currency }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 审核信息 -->
        <div class="review-section" v-if="reviewHistory.length">
          <div class="review-section-title">审核流转</div>
          <div class="review-history-box">
             <div v-for="history in fullTimeline" :key="history.id" class="history-item">
                <div class="history-node" :class="history.action"></div>
                <div class="history-main">
                   <div class="history-action-row">
                      <span class="action-name">{{ getReviewActionName(history.action) }}</span>
                      <span class="operator">{{ history.operator_name }}</span>
                      <span class="time">{{ formatDateTime(history.created_at) }}</span>
                   </div>
                   <div v-if="history.comment" class="history-comment">“{{ history.comment }}”</div>
                </div>
             </div>
          </div>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useReviewStore } from '@/store/review'
import logger from '@/utils/logger'
import {
  formatDateTime,
  formatAmount,
  formatQuantity,
  calculateProfitPricing,
  getReviewActionName
} from '@/utils/review'
import StatusBadge from '@/components/common/StatusBadge.vue'
import '@/styles/review-dialog.css'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  quotationId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue'])
const reviewStore = useReviewStore()
const loading = ref(false)
const activeTab = ref('material')

const quotationDetail = ref(null)
const items = ref([])
const reviewHistory = ref([])
const customProfitTiers = ref([])

const resetData = () => {
  quotationDetail.value = null
  items.value = []
  reviewHistory.value = []
  customProfitTiers.value = []
}

const handleBeforeClose = (done) => {
  emit('update:modelValue', false)
  done()
}

const loadDetail = async () => {
  loading.value = true
  try {
    const response = await reviewStore.fetchReviewDetail(props.quotationId)
    if (response.success) {
      quotationDetail.value = response.data.quotation
      items.value = response.data.items || []
      reviewHistory.value = response.data.history || []
      if (quotationDetail.value.custom_profit_tiers) {
        try { customProfitTiers.value = JSON.parse(quotationDetail.value.custom_profit_tiers) } catch (e) { customProfitTiers.value = [] }
      }
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.quotationId],
  ([visible, id]) => {
    if (visible && id) loadDetail()
    if (!visible) resetData()
  },
  { immediate: true }
)

const materialItems = computed(() => items.value.filter(i => i.category === 'material'))
const processItems = computed(() => items.value.filter(i => i.category === 'process'))
const packagingItems = computed(() => items.value.filter(i => i.category === 'packaging'))

const materialSubtotal = computed(() => materialItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))
const processSubtotal = computed(() => processItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))
const packagingSubtotal = computed(() => packagingItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))

const profitPricing = computed(() => {
  if (!quotationDetail.value) return []
  const systemTiers = calculateProfitPricing(quotationDetail.value.final_price, quotationDetail.value.sales_type).map(tier => ({ ...tier, isCustom: false }))
  const customTiers = customProfitTiers.value.map(tier => ({
    rate: tier.profitRate * 100,
    price: parseFloat(tier.price),
    currency: quotationDetail.value.sales_type === 'export' ? 'USD' : 'CNY',
    isCustom: true
  }))
  const allTiers = [...systemTiers, ...customTiers]
  allTiers.sort((a, b) => a.rate - b.rate)
  return allTiers
})

const fullTimeline = computed(() => {
  const timeline = []
  if (quotationDetail.value?.created_at) {
    timeline.push({ id: 'created', action: 'created', operator_name: quotationDetail.value.creator_name || '-', created_at: quotationDetail.value.created_at })
  }
  if (quotationDetail.value?.submitted_at) {
    timeline.push({ id: 'submitted', action: 'submitted', operator_name: quotationDetail.value.creator_name || '-', created_at: quotationDetail.value.submitted_at })
  }
  reviewHistory.value.forEach(h => timeline.push(h))
  timeline.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return timeline
})

const costComposition = computed(() => {
  const material = materialSubtotal.value
  const process = processSubtotal.value
  const packaging = packagingSubtotal.value
  const shipping = Number(quotationDetail.value?.freight_per_unit || 0)
  const total = material + process + packaging + shipping || 1
  return { material, process, packaging, shipping, materialPercent: (material / total) * 100, processPercent: (process / total) * 100, packagingPercent: (packaging / total) * 100, shippingPercent: (shipping / total) * 100 }
})

const formatNumber = (value, decimals = 4) => {
  if (value === null || value === undefined) return '-'
  const num = parseFloat(value)
  return isNaN(num) ? '-' : num.toFixed(decimals)
}

const formatPackagingSpec = (row) => {
  if (!row.packaging_type) return ''
  if (row.packaging_type === 'no_box') return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/箱`
  if (row.packaging_type === 'blister_direct') return `${row.layer1_qty}pc/泡壳, ${row.layer2_qty}泡壳/箱`
  if (row.packaging_type === 'blister_bag') return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/泡壳, ${row.layer3_qty}泡壳/箱`
  return `${row.layer1_qty}片/袋, ${row.layer2_qty}袋/盒, ${row.layer3_qty}盒/箱`
}

const handleExport = () => { ElMessage.info('导出功能开发中') }
</script>

<style scoped>
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 成本构成摘要网格 */
.cost-composition-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
.comp-item { padding: 12px; background: var(--review-bg-secondary); border-radius: var(--review-radius); border: 1px solid var(--review-border-light); text-align: center; }
.comp-label { font-size: 11px; color: var(--review-text-tertiary); margin-bottom: 4px; }
.comp-value { font-size: 13px; font-weight: 600; color: var(--review-text-primary); }
.comp-percent { font-size: 11px; color: var(--review-text-secondary); margin-top: 2px; }

/* 审核历史简易样式 */
.review-history-box { display: flex; flex-direction: column; gap: 16px; padding: 12px 0; }
.history-item { display: flex; gap: 12px; position: relative; }
.history-node { width: 8px; height: 8px; border-radius: 50%; background: var(--review-border); margin-top: 6px; flex-shrink: 0; z-index: 1; }
.history-node.approved { background: var(--review-accent-green); }
.history-node.rejected { background: var(--review-accent-red); }
.history-node.submitted { background: var(--review-accent-blue); }
.history-main { flex: 1; }
.history-action-row { display: flex; align-items: baseline; gap: 12px; font-size: 12px; }
.action-name { font-weight: 600; color: var(--review-text-primary); }
.operator { color: var(--review-text-secondary); }
.time { color: var(--review-text-tertiary); margin-left: auto; }
.history-comment { margin-top: 4px; padding: 8px 12px; background: var(--review-bg-secondary); border-radius: var(--review-radius); font-size: 12px; color: var(--review-text-secondary); font-style: italic; }

@media (max-width: 768px) {
  .cost-composition-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
