<template>
  <!-- 整柜运费卡片 -->
  <div v-if="type === 'fcl'" class="freight-result-card fcl">
    <div class="freight-result-decor"></div>
    <div class="freight-result-content">
      <!-- 左侧：核心费用 -->
      <div class="freight-result-main">
        <div class="freight-result-badge">
          整柜运费 ({{ shippingMethod === 'fcl_40' ? '40GP' : '20GP' }})
        </div>
        <div class="freight-result-price">
          <span class="currency">¥</span>{{ Math.round(freightCalculation.totalFreight).toLocaleString() }}
        </div>
        <div class="freight-result-meta">
          <span class="freight-result-usd">${{ freightCalculation.freightUSD }} USD</span>
          <span class="freight-result-divider">|</span>
          <span>汇率 {{ freightCalculation.exchangeRate }}</span>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="freight-result-separator"></div>

      <!-- 右侧：装箱参数 -->
      <div class="freight-result-params">
        <div class="freight-param">
          <div class="freight-param-label">单箱材积</div>
          <div class="freight-param-value">{{ freightCalculation.cartonVolume || '-' }} ft³</div>
        </div>
        <div class="freight-param">
          <div class="freight-param-label">最大可装</div>
          <div class="freight-param-value highlight">{{ freightCalculation.maxCartons ? Number(freightCalculation.maxCartons).toLocaleString() : '-' }} 箱</div>
        </div>
        <div class="freight-param">
          <div class="freight-param-label">每箱只数</div>
          <div class="freight-param-value">{{ freightCalculation.pcsPerCarton || '-' }} pcs</div>
        </div>
        <div class="freight-param">
          <div class="freight-param-label">本次数量</div>
          <div class="freight-param-value">{{ quantity ? Number(quantity).toLocaleString() : '-' }} pcs</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 散货运费卡片 -->
  <div v-else-if="type === 'lcl'" class="freight-result-card lcl">
    <div class="freight-result-decor"></div>
    <div class="freight-result-content">
      <!-- 左侧：核心费用 -->
      <div class="freight-result-main">
        <div class="freight-result-badge lcl">散货拼箱运费</div>
        <div class="freight-result-price">
          <span class="currency">¥</span>{{ freightCalculation.totalFreight }}
        </div>
        <div class="freight-result-meta">
          计费体积: <strong>{{ freightCalculation.ceiledCBM }}</strong> CBM
        </div>
      </div>

      <!-- 分割线 -->
      <div class="freight-result-separator lcl"></div>

      <!-- 右侧：费用明细 -->
      <div class="freight-result-details">
        <div class="freight-detail-row">
          <span>基础运费:</span>
          <span>¥{{ freightCalculation.baseFreight }}</span>
        </div>
        <div class="freight-detail-row">
          <span>操作费:</span>
          <span>¥{{ freightCalculation.handlingCharge }}</span>
        </div>
        <div class="freight-detail-row">
          <span>拼箱费:</span>
          <span>¥{{ freightCalculation.cfs }}</span>
        </div>
        <div class="freight-detail-row">
          <span>文件费:</span>
          <span>¥{{ freightCalculation.documentFee }}</span>
        </div>
        <div class="freight-detail-footer">
          实际CBM: {{ freightCalculation.cbm }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, required: true, validator: (v) => ['fcl', 'lcl'].includes(v) },
  shippingMethod: { type: String, default: '' },
  freightCalculation: { type: Object, required: true },
  quantity: { type: Number, default: 0 }
})
</script>

<style scoped>
.freight-result-card {
  @apply relative rounded-xl border overflow-hidden mt-4;
  transition: box-shadow 0.2s ease;
}
.freight-result-card:hover {
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.1);
}
.freight-result-card.fcl {
  @apply bg-gradient-to-br from-blue-50 to-white border-blue-200;
}
.freight-result-card.lcl {
  @apply bg-gradient-to-br from-amber-50 to-white border-amber-200;
}

.freight-result-decor {
  @apply absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl pointer-events-none;
}
.freight-result-card.fcl .freight-result-decor {
  @apply bg-blue-100/50;
}
.freight-result-card.lcl .freight-result-decor {
  @apply bg-amber-100/50;
}

.freight-result-content {
  @apply relative z-10 p-5 flex flex-col md:flex-row md:items-stretch gap-6;
}

.freight-result-main {
  @apply flex-1 flex flex-col justify-center min-w-[200px];
}

.freight-result-badge {
  @apply inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-1 w-fit;
}
.freight-result-card.fcl .freight-result-badge {
  @apply bg-blue-100/50 text-blue-600;
}
.freight-result-badge.lcl {
  @apply bg-amber-100/50 text-amber-600;
}

.freight-result-price {
  @apply text-3xl font-bold text-slate-800 tracking-tight;
  font-variant-numeric: tabular-nums;
}
.freight-result-price .currency {
  @apply text-lg text-slate-500 font-normal mr-1;
}

.freight-result-meta {
  @apply mt-2 flex items-center gap-2 text-sm text-slate-500;
}
.freight-result-usd {
  @apply px-2 py-0.5 bg-white/60 rounded border border-slate-100 font-medium text-slate-700;
}
.freight-result-divider {
  @apply text-slate-300;
}

.freight-result-separator {
  @apply hidden md:block w-px;
}
.freight-result-card.fcl .freight-result-separator {
  background: linear-gradient(to bottom, transparent, #bfdbfe, transparent);
}
.freight-result-separator.lcl {
  background: linear-gradient(to bottom, transparent, #fde68a, transparent);
}

.freight-result-params {
  @apply flex-1 grid grid-cols-2 gap-y-3 gap-x-4;
}

.freight-param {
  @apply space-y-1;
}
.freight-param-label {
  @apply text-xs text-slate-400;
}
.freight-param-value {
  @apply font-medium text-slate-700;
}
.freight-param-value.highlight {
  @apply text-blue-600;
}

.freight-result-details {
  @apply flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-sm;
}

.freight-detail-row {
  @apply flex justify-between;
}
.freight-detail-row span:first-child {
  @apply text-slate-500;
}
.freight-detail-row span:last-child {
  @apply font-medium text-slate-700;
}

.freight-detail-footer {
  @apply col-span-2 mt-2 pt-2 border-t border-amber-100 text-xs text-slate-400;
}
</style>
