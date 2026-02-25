<template>
  <div class="review-section">
    <div class="review-section-title">基础信息</div>
    <div class="review-info-grid info-grid-override">
      <div class="review-info-card">
        <div class="review-info-label">客户名称</div>
        <div class="review-info-value">{{ quotation.customer_name }}</div>
      </div>
      <div class="review-info-card">
        <div class="review-info-label">客户地区</div>
        <div class="review-info-value">{{ quotation.customer_region || '-' }}</div>
      </div>
      <div class="review-info-card">
        <div class="review-info-label">产品型号</div>
        <div class="review-info-value">{{ quotation.model_name }}</div>
      </div>
      <div class="review-info-card">
        <div class="review-info-label">订单数量</div>
        <div class="review-info-value">{{ formatQuantity(quotation.quantity) }} PCS</div>
      </div>
      <div class="review-info-card lg:col-span-2">
        <div class="review-info-label">包装方式</div>
        <div class="review-info-value">
          {{ quotation.packaging_config_name || '-' }}
          <div class="review-info-sub" v-if="quotation.packaging_type">
             ({{ quotation.layer1_qty }}片/袋, {{ quotation.layer2_qty }}袋/盒, {{ quotation.layer3_qty }}盒/箱)
          </div>
        </div>
      </div>
      <div class="review-info-card">
        <div class="review-info-label">创建人</div>
        <div class="review-info-value">{{ quotation.creator_name || '-' }}</div>
      </div>
      <div class="review-info-card">
        <div class="review-info-label">最终价格</div>
        <div class="review-info-value text-blue-600 font-bold">
          {{ formatNumber(quotation.final_price) }} {{ quotation.currency }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatNumber } from '@/utils/format'

defineProps({
  quotation: Object
})

const formatQuantity = (val) => {
  if (!val) return '0'
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
</script>

<style scoped>
.info-grid-override {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1024px) {
  .info-grid-override {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
