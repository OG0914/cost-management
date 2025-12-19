<template>
  <div class="profit-pricing" :class="{ 'compact': compact }">
    <div class="profit-title" v-if="showTitle">利润报价:</div>
    <div class="profit-list" :class="{ 'horizontal': horizontal }">
      <div v-for="item in profitItems" :key="item.rate" class="profit-item">
        <span class="rate">{{ item.rate }}%:</span>
        <span class="price">{{ item.price.toFixed(4) }} {{ item.currency }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateProfitPricing } from '@/utils/review'

const props = defineProps({
  baseCost: {
    type: Number,
    required: true
  },
  overheadRate: {
    type: Number,
    default: 0.25
  },
  exchangeRate: {
    type: Number,
    default: 7.2
  },
  salesType: {
    type: String,
    default: 'export',
    validator: (value) => ['domestic', 'export'].includes(value)
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  horizontal: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const profitItems = computed(() => {
  if (!props.baseCost) return []
  return calculateProfitPricing(
    props.baseCost,
    props.overheadRate,
    props.exchangeRate,
    props.salesType
  )
})
</script>

<style scoped>
.profit-pricing {
  width: 100%;
}

.profit-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.profit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profit-list.horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

.profit-item {
  font-size: 13px;
  display: flex;
  gap: 8px;
}

.profit-item .rate {
  color: #606266;
  min-width: 36px;
}

.profit-item .price {
  color: #303133;
  font-weight: 500;
}

/* 紧凑模式 */
.compact .profit-title {
  font-size: 12px;
  margin-bottom: 6px;
}

.compact .profit-item {
  font-size: 12px;
}

.compact .profit-list {
  gap: 4px;
}
</style>
