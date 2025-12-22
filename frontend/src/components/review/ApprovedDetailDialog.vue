<template>
  <el-dialog
    :model-value="modelValue"
    :title="`📋 报价单详情   ${quotationDetail?.quotation_no || ''}`"
    width="850px"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    destroy-on-close
    append-to-body
  >
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <span :id="titleId" :class="titleClass">📋 报价单详情   {{ quotationDetail?.quotation_no || '' }}</span>
        <div class="header-actions">
          <el-button type="primary" size="small" icon="Download" @click="handleExport">导出</el-button>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="approved-detail-content">
      <template v-if="quotationDetail">
        <!-- 报价单摘要 -->
        <div class="section">
          <div class="section-title">报价单摘要</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-title">📋 基本信息</div>
              <div class="card-content">
                <div class="info-line"><span class="label">客户名称:</span><span class="value">{{ quotationDetail.customer_name }}</span></div>
                <div class="info-line"><span class="label">客户地区:</span><span class="value">{{ quotationDetail.customer_region || '-' }}</span></div>
                <div class="info-line"><span class="label">销售类型:</span><span class="value">{{ getSalesTypeName(quotationDetail.sales_type) }}</span></div>
                <div class="info-line"><span class="label">法规类别:</span><span class="value">{{ quotationDetail.regulation_name || '-' }}</span></div>
                <div class="info-line"><span class="label">产品型号:</span><span class="value">{{ quotationDetail.model_name }}</span></div>
                <div class="info-line"><span class="label">订单数量:</span><span class="value">{{ formatQuantity(quotationDetail.quantity) }}</span></div>
                <div class="info-line"><span class="label">包装配置:</span>
                  <span class="value">
                    <template v-if="quotationDetail.packaging_config_name">
                      {{ quotationDetail.packaging_config_name }}
                      <span style="color: #909399; font-size: 12px; margin-left: 8px;">
                        {{ formatPackagingSpec(quotationDetail) }}
                      </span>
                    </template>
                    <template v-else>-</template>
                  </span>
                </div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-title">💰 价格信息</div>
              <div class="card-content">
                <div class="info-line"><span class="label">成本价格:</span><span class="value">{{ Number(quotationDetail.base_cost || 0).toFixed(4) }} CNY</span></div>
                <div class="info-line"><span class="label">管销价格:</span><span class="value">{{ Number(quotationDetail.overhead_price || 0).toFixed(4) }} CNY</span></div>
                <div class="info-line"><span class="label">最终价格:</span><span class="value highlight">{{ formatAmount(quotationDetail.final_price, quotationDetail.currency) }}</span></div>
                <div class="profit-section">
                  <div class="profit-title">利润报价:</div>
                  <div class="profit-list">
                    <div v-for="item in profitPricing" :key="item.rate" class="profit-line" :class="{ 'custom-tier': item.isCustom }">
                      {{ item.rate }}%: {{ Number(item.price || 0).toFixed(4) }} {{ item.currency }}
                      <span v-if="item.isCustom" class="custom-tag">自定义</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 审核结果 -->
        <div class="section">
          <div class="section-title" :class="quotationDetail.status === 'approved' ? 'status-approved' : 'status-rejected'">
            {{ quotationDetail.status === 'approved' ? '✅ 审核结果' : '❌ 审核结果' }}
          </div>
          <div class="result-box" :class="quotationDetail.status === 'approved' ? 'result-approved' : 'result-rejected'">
            <div class="result-icon">
              {{ quotationDetail.status === 'approved' ? '✅' : '❌' }}
            </div>
            <div class="result-text">
              {{ quotationDetail.status === 'approved' ? '该报价单已审核通过' : '该报价单已被退回' }}
            </div>
            <div class="result-time">
              审核时间：{{ formatDateTime(quotationDetail.reviewed_at) }}
            </div>
          </div>
          <div v-if="reviewComment" class="comment-section">
            <div class="comment-label">{{ quotationDetail.status === 'approved' ? '审核批注：' : '退回原因：' }}</div>
            <div class="comment-content">{{ reviewComment }}</div>
          </div>
        </div>

        <!-- 成本构成 -->
        <div class="section">
          <div class="section-title">成本构成（只读）</div>
          <div class="cost-composition">
            <div class="cost-item">
              <div class="cost-label">原料成本</div>
              <div class="cost-value">{{ Number(costComposition.material || 0).toFixed(4) }} CNY</div>
              <div class="cost-percent">({{ Number(costComposition.materialPercent || 0).toFixed(1) }}%)</div>
            </div>
            <div class="cost-item">
              <div class="cost-label">工序成本</div>
              <div class="cost-value">{{ Number(costComposition.process || 0).toFixed(4) }} CNY</div>
              <div class="cost-percent">({{ Number(costComposition.processPercent || 0).toFixed(1) }}%)</div>
            </div>
            <div class="cost-item">
              <div class="cost-label">包材成本</div>
              <div class="cost-value">{{ Number(costComposition.packaging || 0).toFixed(4) }} CNY</div>
              <div class="cost-percent">({{ Number(costComposition.packagingPercent || 0).toFixed(1) }}%)</div>
            </div>
            <div class="cost-item">
              <div class="cost-label">运费成本</div>
              <div class="cost-value">{{ Number(costComposition.shipping || 0).toFixed(4) }} CNY</div>
              <div class="cost-percent">({{ Number(costComposition.shippingPercent || 0).toFixed(1) }}%)</div>
            </div>
          </div>
        </div>

        <!-- 审核历史 -->
        <div class="section">
          <div class="section-title">审核历史</div>
          <div class="timeline">
            <div v-for="(history, index) in fullTimeline" :key="history.id" class="timeline-item">
              <div class="timeline-dot" :class="{ 'active': index === fullTimeline.length - 1 }"></div>
              <div class="timeline-content">
                <div class="timeline-action">{{ getReviewActionName(history.action) }}</div>
                <div class="timeline-operator">{{ history.operator_name }}</div>
                <div class="timeline-time">{{ formatDateTime(history.created_at) }}</div>
              </div>
              <div v-if="index < fullTimeline.length - 1" class="timeline-line"></div>
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
import {
  getSalesTypeName,
  formatDateTime,
  formatAmount,
  formatQuantity,
  calculateProfitPricing,
  getReviewActionName
} from '@/utils/review'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  quotationId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const reviewStore = useReviewStore()

const loading = ref(false)

// 数据
const quotationDetail = ref(null)
const items = ref([])
const reviewHistory = ref([])
const reviewComment = ref('')
const customProfitTiers = ref([])

// 监听 modelValue 和 quotationId
watch(
  () => [props.modelValue, props.quotationId],
  ([visible, id]) => {
    if (visible && id) {
      loadDetail()
    }
    // 关闭时清空数据
    if (!visible) {
      quotationDetail.value = null
      items.value = []
      reviewHistory.value = []
      reviewComment.value = ''
      customProfitTiers.value = []
    }
  },
  { immediate: true }
)

// 处理弹窗关闭前的回调
const handleBeforeClose = (done) => {
  emit('update:modelValue', false)
  done()
}

// 利润报价 - 合并系统默认和自定义利润区间
const profitPricing = computed(() => {
  if (!quotationDetail.value) return []
  
  // 系统默认利润区间
  const systemTiers = calculateProfitPricing(
    quotationDetail.value.base_cost,
    0.25,
    7.2,
    quotationDetail.value.sales_type
  ).map(tier => ({ ...tier, isCustom: false }))
  
  // 自定义利润区间
  const customTiers = customProfitTiers.value.map(tier => ({
    rate: tier.profitRate * 100,
    price: parseFloat(tier.price),
    currency: quotationDetail.value.sales_type === 'export' ? 'USD' : 'CNY',
    isCustom: true
  }))
  
  // 合并并按利润率排序
  const allTiers = [...systemTiers, ...customTiers]
  allTiers.sort((a, b) => a.rate - b.rate)
  
  return allTiers
})

// 完整的审核历史时间线（包含创建、提交、审核操作）
const fullTimeline = computed(() => {
  const timeline = []
  
  // 添加创建时间
  if (quotationDetail.value?.created_at) {
    timeline.push({
      id: 'created',
      action: 'created',
      operator_name: quotationDetail.value.creator_name || '-',
      created_at: quotationDetail.value.created_at
    })
  }
  
  // 添加提交时间
  if (quotationDetail.value?.submitted_at) {
    timeline.push({
      id: 'submitted',
      action: 'submitted',
      operator_name: quotationDetail.value.creator_name || '-',
      created_at: quotationDetail.value.submitted_at
    })
  }
  
  // 添加审核历史记录
  reviewHistory.value.forEach(h => {
    timeline.push(h)
  })
  
  // 按时间排序
  timeline.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  return timeline
})

// 成本构成
const costComposition = computed(() => {
  const material = items.value.filter(i => i.category === 'material').reduce((sum, i) => sum + Number(i.subtotal || 0), 0)
  const process = items.value.filter(i => i.category === 'process').reduce((sum, i) => sum + Number(i.subtotal || 0), 0)
  const packaging = items.value.filter(i => i.category === 'packaging').reduce((sum, i) => sum + Number(i.subtotal || 0), 0)
  const shipping = Number(quotationDetail.value?.freight_per_unit || 0)
  const total = material + process + packaging + shipping || 1
  
  return {
    material,
    process,
    packaging,
    shipping,
    materialPercent: (material / total) * 100,
    processPercent: (process / total) * 100,
    packagingPercent: (packaging / total) * 100,
    shippingPercent: (shipping / total) * 100
  }
})

// 加载详情
const loadDetail = async () => {
  loading.value = true
  try {
    const response = await reviewStore.fetchReviewDetail(props.quotationId)
    if (response.success) {
      quotationDetail.value = response.data.quotation
      items.value = response.data.items || []
      reviewHistory.value = response.data.history || []
      // 获取最新的审核批注
      const comments = response.data.comments || []
      reviewComment.value = comments.length > 0 ? comments[comments.length - 1].content : ''
      
      // 解析自定义利润区间
      if (quotationDetail.value.custom_profit_tiers) {
        try {
          customProfitTiers.value = JSON.parse(quotationDetail.value.custom_profit_tiers)
        } catch (e) {
          console.error('解析自定义利润档位失败:', e)
          customProfitTiers.value = []
        }
      } else {
        customProfitTiers.value = []
      }
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

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

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 关闭弹窗（保留以备其他地方调用）
const closeDialog = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  margin-right: 30px;
}

.approved-detail-content {
  max-height: 65vh;
  overflow-y: auto;
}

.section {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.status-approved {
  color: #67c23a;
}

.status-rejected {
  color: #f56c6c;
}

.summary-grid {
  display: flex;
  gap: 20px;
}

.summary-card {
  flex: 1;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-line {
  display: flex;
  font-size: 13px;
}

.info-line .label {
  width: 70px;
  color: #909399;
}

.info-line .value {
  color: #303133;
}

.info-line .value.highlight {
  color: #409eff;
  font-weight: 600;
}

.profit-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.profit-title {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.profit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profit-line {
  font-size: 13px;
  color: #303133;
  padding-left: 12px;
}

.profit-line.custom-tier {
  color: #E6A23C;
}

.custom-tag {
  font-size: 10px;
  background: #fdf6ec;
  color: #E6A23C;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 6px;
}

.result-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  position: relative;
}

.result-approved {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.result-rejected {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.result-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.result-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.result-time {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-size: 12px;
  color: #909399;
}

.comment-section {
  margin-top: 16px;
}

.comment-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.comment-content {
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
}

.cost-composition {
  display: flex;
  gap: 16px;
}

.cost-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.cost-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.cost-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.cost-percent {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.timeline {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dcdfe6;
  margin-bottom: 8px;
}

.timeline-dot.active {
  background: #409eff;
}

.timeline-content {
  text-align: center;
}

.timeline-action {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.timeline-operator {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.timeline-line {
  position: absolute;
  top: 6px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #dcdfe6;
  z-index: -1;
}
</style>
