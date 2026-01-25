<template>
  <div class="freight-card cif" v-if="freightCalculation">
    <div class="freight-card-glow"></div>
    <div class="freight-card-content">
      <div class="freight-card-main">
        <div class="freight-card-badge">
          <span class="badge-text">CIF 深圳运费</span>
          <el-tag size="small" type="info" class="factory-tag">{{ factoryName }}</el-tag>
        </div>
        <div class="freight-card-price">
          <span class="price-currency">¥</span>{{ Math.round(freightCalculation.totalFreight).toLocaleString() }}
        </div>
        <div class="freight-card-meta">
          <span class="meta-item">计费体积: <span class="meta-highlight">{{ freightCalculation.ceiledCBM }}</span> CBM</span>
        </div>
      </div>
      <div class="freight-card-divider"></div>
      <div class="freight-card-details">
        <div class="detail-row">
          <span class="detail-label">CFS费:</span>
          <span class="detail-value">¥{{ freightCalculation.cfs }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">文件费:</span>
          <span class="detail-value">¥{{ freightCalculation.docFee }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">报关费:</span>
          <span class="detail-value">¥{{ freightCalculation.customsFee }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">仓库费:</span>
          <span class="detail-value">¥{{ freightCalculation.warehouseFee }}</span>
        </div>
        <div class="detail-row footer">
          <span class="detail-label">海运费 ({{ freightCalculation.seaFreightUSDPerCbm }} USD/CBM):</span>
          <span class="detail-value">¥{{ Math.round(freightCalculation.seaFreightCNY) }} ({{ freightCalculation.seaFreightUSDEstimated }} USD)</span>
        </div>
        <div class="detail-row footer">
          <span class="detail-label">国内运费 ({{ transportLabel }}):</span>
          <span class="detail-value">¥{{ freightCalculation.domesticTransportFee }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ name: 'FreightCardCIF' })

const props = defineProps({
  freightCalculation: { type: Object, default: null }
})

const factoryName = computed(() => props.freightCalculation?.factory === 'hubei_zhiteng' ? '湖北知腾工厂' : '东莞迅安工厂')
const transportLabel = computed(() => props.freightCalculation?.factory === 'hubei_zhiteng' ? '湖北卡车' : '东莞分档')
</script>

<style scoped>
.freight-card { position: relative; border-radius: 12px; overflow: hidden; transition: all 0.3s; margin: 16px 0; }
.freight-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.freight-card.cif { background: linear-gradient(135deg, #faf5ff 0%, #fff 100%); border: 1px solid #e9d5ff; }
.freight-card-glow { position: absolute; right: -40px; top: -40px; width: 128px; height: 128px; border-radius: 50%; background: rgba(168, 85, 247, 0.15); filter: blur(48px); pointer-events: none; }
.freight-card-content { position: relative; z-index: 1; padding: 20px; display: flex; gap: 24px; }
.freight-card-main { flex: 1; min-width: 200px; }
.freight-card-badge { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.badge-text { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9333ea; background: rgba(168, 85, 247, 0.15); padding: 2px 8px; border-radius: 4px; }
.factory-tag { margin-left: 4px; }
.freight-card-price { font-size: 32px; font-weight: 700; color: #1e293b; font-family: ui-monospace, monospace; line-height: 1.2; }
.price-currency { font-size: 18px; font-weight: 400; color: #64748b; margin-right: 2px; }
.freight-card-meta { margin-top: 8px; font-size: 13px; color: #64748b; }
.meta-item { background: rgba(255, 255, 255, 0.6); padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
.meta-highlight { font-weight: 700; color: #1e293b; }
.freight-card-divider { width: 1px; background: linear-gradient(to bottom, transparent, #e9d5ff, transparent); }
.freight-card-details { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.detail-row { display: flex; justify-content: space-between; font-size: 13px; }
.detail-label { color: #64748b; }
.detail-value { font-weight: 500; color: #334155; }
.detail-row.footer { margin-top: 4px; padding-top: 4px; border-top: 1px solid #e9d5ff; }
@media (max-width: 768px) {
  .freight-card-content { flex-direction: column; gap: 16px; }
  .freight-card-divider { width: 100%; height: 1px; background: linear-gradient(to right, transparent, #e9d5ff, transparent); }
}
</style>
