<template>
  <div class="review-section">
    <div class="review-section-title">运费及物流</div>
    <div class="review-logistics-panel">
      <div class="review-logistics-grid">
        <div class="logistics-item">
          <div class="logistics-label">销售类型</div>
          <div class="logistics-value">
            <span class="status-badge" :class="quotation.sales_type">
              {{ quotation.sales_type === 'domestic' ? '国内销售' : '国外出口' }}
            </span>
          </div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">发货方式</div>
          <div class="logistics-value">{{ formatShippingMethod(quotation.shipping_method) || '-' }}</div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">发货港口</div>
          <div class="logistics-value">{{ quotation.port || '-' }}</div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">运费计入成本</div>
          <div class="logistics-value" :class="quotation.include_freight_in_base ? 'text-green-600' : 'text-gray-400'">
            {{ quotation.include_freight_in_base ? '已计入' : '未计入' }}
          </div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">总箱数</div>
          <div class="logistics-value">{{ shippingInfo.cartons || '-' }} 箱</div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">总体积 (CBM)</div>
          <div class="logistics-value">{{ shippingInfo.cbm || '-' }} m³</div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">总运费</div>
          <div class="logistics-value">¥{{ formatNumber(quotation.freight_total) }}</div>
        </div>
        <div class="logistics-item">
          <div class="logistics-label">每片分摊</div>
          <div class="logistics-value highlight">¥{{ formatNumber(quotation.freight_per_unit) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatNumber } from '@/utils/format'

defineProps({
  quotation: Object,
  shippingInfo: Object
})

const formatShippingMethod = (method) => {
  const map = { fcl_40: '40GP', fcl_20: '20GP', lcl: 'LCL散货' }
  return map[method] || method
}
</script>

<style scoped>
.highlight { color: var(--review-accent-blue); font-weight: 600; }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-badge.domestic { background: #E6F7FF; color: #1890FF; }
.status-badge.export { background: #F9F0FF; color: #722ED1; }
</style>
