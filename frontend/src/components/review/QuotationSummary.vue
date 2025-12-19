<template>
  <div class="quotation-summary" :class="{ 'simple-mode': viewMode === 'simple' }">
    <div class="summary-grid">
      <!-- 基本信息卡片 -->
      <div class="summary-card">
        <div class="card-title">📋 基本信息</div>
        <div class="card-content">
          <div class="info-line">
            <span class="label">客户名称:</span>
            <span class="value">{{ quotation?.customer_name || '-' }}</span>
          </div>
          <div class="info-line">
            <span class="label">客户地区:</span>
            <span class="value">{{ quotation?.customer_region || '-' }}</span>
          </div>
          <div class="info-line">
            <span class="label">销售类型:</span>
            <span class="value">{{ getSalesTypeName(quotation?.sales_type) }}</span>
          </div>
          <div class="info-line">
            <span class="label">法规类别:</span>
            <span class="value">{{ quotation?.regulation_name || '-' }}</span>
          </div>
          <div class="info-line">
            <span class="label">产品型号:</span>
            <span class="value">{{ quotation?.model_name || '-' }}</span>
          </div>
          <div class="info-line">
            <span class="label">订单数量:</span>
            <span class="value">{{ formatQuantity(quotation?.quantity) }}</span>
          </div>
          <div class="info-line" v-if="viewMode === 'full'">
            <span class="label">包装配置:</span>
            <span class="value">{{ formatPackaging(quotation?.packaging_config) }}</span>
          </div>
          <div class="info-line packaging-line" v-else>
            <span class="label">包装配置:</span>
            <span class="value">{{ formatPackaging(quotation?.packaging_config) }}</span>
          </div>
        </div>
      </div>

      <!-- 价格信息卡片 -->
      <div class="summary-card">
        <div class="card-title">💰 {{ viewMode === 'simple' ? '价格信息' : '报价信息' }}</div>
        <div class="card-content">
          <!-- 完整视图显示成本价和管销价 -->
          <template v-if="viewMode === 'full'">
            <div class="info-line">
              <span class="label">成本价格:</span>
              <span class="value">{{ quotation?.base_cost?.toFixed(4) || '-' }} CNY</span>
            </div>
            <div class="info-line">
              <span class="label">管销价格:</span>
              <span class="value">{{ quotation?.overhead_price?.toFixed(4) || '-' }} CNY</span>
            </div>
          </template>
          <div class="info-line final-price">
            <span class="label">最终价格:</span>
            <span class="value highlight">{{ formatAmount(quotation?.final_price, quotation?.currency) }}</span>
          </div>
          
          <!-- 利润报价 -->
          <div class="profit-section" v-if="showProfitPricing && profitPricing.length > 0">
            <div class="profit-divider"></div>
            <div class="profit-title">利润报价:</div>
            <div class="profit-list">
              <div v-for="item in profitPricing" :key="item.rate" class="profit-item">
                {{ item.rate }}%: {{ item.price.toFixed(4) }} {{ item.currency }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSalesTypeName, formatAmount, formatQuantity, calculateProfitPricing } from '@/utils/review'

const props = defineProps({
  quotation: {
    type: Object,
    default: null
  },
  viewMode: {
    type: String,
    default: 'full', // 'full' | 'simple'
    validator: (value) => ['full', 'simple'].includes(value)
  },
  showProfitPricing: {
    type: Boolean,
    default: true
  }
})

// 利润报价计算
const profitPricing = computed(() => {
  if (!props.quotation || !props.showProfitPricing) return []
  return calculateProfitPricing(
    props.quotation.base_cost,
    0.25,
    7.2,
    props.quotation.sales_type
  )
})

// 格式化包装配置
const formatPackaging = (config) => {
  if (!config) return '-'
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config)
    } catch {
      return config
    }
  }
  const parts = []
  if (config.pieces_per_bag) parts.push(`${config.pieces_per_bag}片/袋`)
  if (config.bags_per_box) parts.push(`${config.bags_per_box}袋/盒`)
  if (config.boxes_per_carton) parts.push(`${config.boxes_per_carton}盒/箱`)
  return parts.join(', ') || '-'
}
</script>

<style scoped>
.quotation-summary {
  width: 100%;
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

/* 4字符对齐栏位名称 */
.info-line .label {
  width: 70px;
  min-width: 70px;
  color: #909399;
  flex-shrink: 0;
}

.info-line .value {
  color: #303133;
  word-break: break-all;
}

.info-line .value.highlight {
  color: #409eff;
  font-weight: 600;
}

.final-price {
  margin-top: 4px;
}

.final-price .value.highlight {
  font-size: 15px;
}

.profit-section {
  margin-top: 8px;
}

.profit-divider {
  border-top: 1px dashed #e4e7ed;
  margin-bottom: 12px;
}

.profit-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.profit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 12px;
}

.profit-item {
  font-size: 13px;
  color: #303133;
}

/* 简略视图样式调整 */
.simple-mode .summary-grid {
  gap: 16px;
}

.simple-mode .summary-card {
  padding: 14px;
}

.simple-mode .info-line {
  font-size: 13px;
}

.packaging-line .value {
  font-size: 12px;
  color: #606266;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .summary-grid {
    flex-direction: column;
  }
}
</style>
