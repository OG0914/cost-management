<template>
  <div class="freight-card lcl" v-if="freightCalculation">
    <div class="freight-card-glow"></div>
    <div class="freight-card-content">
      <div class="freight-card-main">
        <div class="freight-card-badge">
          <span class="badge-text">散货拼箱运费</span>
        </div>
        <div class="freight-card-price">
          <span class="price-currency">¥</span>{{ freightCalculation.totalFreight }}
        </div>
        <div class="freight-card-meta">
          <span class="meta-item">计费体积: <span class="meta-highlight">{{ freightCalculation.ceiledCBM }}</span> CBM</span>
        </div>
      </div>
      <div class="freight-card-divider"></div>
      <div class="freight-card-details">
        <div class="detail-row">
          <span class="detail-label">基础运费:</span>
          <span class="detail-value">¥{{ freightCalculation.baseFreight }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作费:</span>
          <span class="detail-value">¥{{ freightCalculation.handlingCharge }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">拼箱费:</span>
          <span class="detail-value">¥{{ freightCalculation.cfs }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">文件费:</span>
          <span class="detail-value">¥{{ freightCalculation.documentFee }}</span>
        </div>
        <div class="detail-row footer">
          <span class="detail-label subtle">实际CBM: {{ freightCalculation.cbm }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'FreightCardLCL' })

defineProps({
  freightCalculation: { type: Object, default: null }
})
</script>

<style scoped>
.freight-card { position: relative; border-radius: 12px; overflow: hidden; transition: all 0.3s; margin: 16px 0; }
.freight-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.freight-card.lcl { background: linear-gradient(135deg, #fff7ed 0%, #fff 100%); border: 1px solid #fed7aa; }
.freight-card-glow { position: absolute; right: -40px; top: -40px; width: 128px; height: 128px; border-radius: 50%; background: rgba(249, 115, 22, 0.15); filter: blur(48px); pointer-events: none; }
.freight-card-content { position: relative; z-index: 1; padding: 20px; display: flex; gap: 24px; }
.freight-card-main { flex: 1; min-width: 200px; }
.freight-card-badge { margin-bottom: 4px; }
.badge-text { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #ea580c; background: rgba(249, 115, 22, 0.15); padding: 2px 8px; border-radius: 4px; }
.freight-card-price { font-size: 32px; font-weight: 700; color: #1e293b; font-family: ui-monospace, monospace; line-height: 1.2; }
.price-currency { font-size: 18px; font-weight: 400; color: #64748b; margin-right: 2px; }
.freight-card-meta { margin-top: 8px; font-size: 13px; color: #64748b; }
.meta-item { background: rgba(255, 255, 255, 0.6); padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
.meta-highlight { font-weight: 700; color: #1e293b; }
.freight-card-divider { width: 1px; background: linear-gradient(to bottom, transparent, #fed7aa, transparent); }
.freight-card-details { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.detail-row { display: flex; justify-content: space-between; font-size: 13px; }
.detail-label { color: #64748b; }
.detail-label.subtle { color: #94a3b8; font-size: 12px; }
.detail-value { font-weight: 500; color: #334155; }
.detail-row.footer { margin-top: 8px; padding-top: 8px; border-top: 1px solid #fed7aa; }
@media (max-width: 768px) {
  .freight-card-content { flex-direction: column; gap: 16px; }
  .freight-card-divider { width: 100%; height: 1px; background: linear-gradient(to right, transparent, #fed7aa, transparent); }
}
</style>
