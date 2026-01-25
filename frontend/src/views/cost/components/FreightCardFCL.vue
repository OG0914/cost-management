<template>
  <div class="freight-card fcl" v-if="freightCalculation">
    <div class="freight-card-glow"></div>
    <div class="freight-card-content">
      <div class="freight-card-main">
        <div class="freight-card-badge">
          <span class="badge-text">整柜运费 ({{ containerType }})</span>
        </div>
        <div class="freight-card-price">
          <span class="price-currency">¥</span>{{ Math.round(freightCalculation.totalFreight).toLocaleString() }}
        </div>
        <div class="freight-card-meta">
          <div class="meta-item">
            <span class="meta-value">${{ freightCalculation.freightUSD }}</span>
            <span class="meta-label">USD</span>
          </div>
          <span class="meta-divider">|</span>
          <span class="meta-text">汇率 {{ freightCalculation.exchangeRate }}</span>
          <span class="meta-divider">|</span>
          <span class="meta-text">CBM <span class="meta-highlight">{{ cbm || '-' }}</span></span>
        </div>
      </div>
      <div class="freight-card-divider"></div>
      <div class="freight-card-details">
        <div class="detail-item">
          <div class="detail-label">单箱材积</div>
          <div class="detail-value">{{ freightCalculation.cartonVolume || '-' }} ft³</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最大可装</div>
          <div class="detail-value highlight">{{ freightCalculation.maxCartons ? Number(freightCalculation.maxCartons).toLocaleString() : '-' }} 箱</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">每箱只数</div>
          <div class="detail-value">{{ freightCalculation.pcsPerCarton || '-' }} pcs</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">本次数量</div>
          <div class="detail-value">{{ quantity ? Number(quantity).toLocaleString() : '-' }} pcs</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'FreightCardFCL' })

const props = defineProps({
  freightCalculation: { type: Object, default: null },
  shippingMethod: { type: String, default: '' },
  cbm: { type: [String, Number], default: null },
  quantity: { type: Number, default: null }
})

import { computed } from 'vue'

const containerType = computed(() => props.shippingMethod === 'fcl_40' ? '40GP' : '20GP')
</script>

<style scoped>
.freight-card { position: relative; border-radius: 12px; overflow: hidden; transition: all 0.3s; margin: 16px 0; }
.freight-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.freight-card.fcl { background: linear-gradient(135deg, #eff6ff 0%, #fff 100%); border: 1px solid #bfdbfe; }
.freight-card-glow { position: absolute; right: -40px; top: -40px; width: 128px; height: 128px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); filter: blur(48px); pointer-events: none; }
.freight-card-content { position: relative; z-index: 1; padding: 20px; display: flex; gap: 24px; }
.freight-card-main { flex: 1; min-width: 200px; }
.freight-card-badge { margin-bottom: 4px; }
.badge-text { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; background: rgba(59, 130, 246, 0.15); padding: 2px 8px; border-radius: 4px; }
.freight-card-price { font-size: 32px; font-weight: 700; color: #1e293b; font-family: ui-monospace, monospace; line-height: 1.2; }
.price-currency { font-size: 18px; font-weight: 400; color: #64748b; margin-right: 2px; }
.freight-card-meta { margin-top: 8px; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #64748b; }
.meta-item { background: rgba(255, 255, 255, 0.6); padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
.meta-value { font-weight: 500; color: #334155; }
.meta-label { font-size: 11px; margin-left: 2px; }
.meta-divider { color: #cbd5e1; }
.meta-highlight { font-weight: 500; color: #334155; }
.freight-card-divider { width: 1px; background: linear-gradient(to bottom, transparent, #bfdbfe, transparent); }
.freight-card-details { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 16px; }
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: 11px; color: #94a3b8; }
.detail-value { font-size: 14px; font-weight: 500; color: #334155; }
.detail-value.highlight { color: #2563eb; }
@media (max-width: 768px) {
  .freight-card-content { flex-direction: column; gap: 16px; }
  .freight-card-divider { width: 100%; height: 1px; background: linear-gradient(to right, transparent, #bfdbfe, transparent); }
}
</style>
