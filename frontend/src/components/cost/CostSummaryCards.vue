<template>
  <div class="cost-section">
    <div class="cost-section-header">
      <h3 class="cost-section-title">
        <i class="ri-calculator-line bg-indigo-500"></i>
        成本计算
      </h3>
    </div>
    <div class="cost-section-body">
      <!-- 成本卡片 -->
      <div class="cost-summary-grid">
        <div class="cost-summary-card">
          <div class="cost-summary-label">基础成本价</div>
          <div class="cost-summary-value">{{ formatNumber(calculation.baseCost) }} CNY</div>
        </div>
        <div class="cost-summary-card">
          <div class="cost-summary-label">运费成本</div>
          <div class="cost-summary-value">{{ formatNumber(calculation.freightCost) }} CNY</div>
        </div>
        <div class="cost-summary-card">
          <div class="cost-summary-label">管销价</div>
          <div class="cost-summary-value">{{ formatNumber(calculation.overheadPrice) }} CNY</div>
          <el-button size="small" type="primary" link @click="$emit('add-fee')" class="cost-summary-action">
            <i class="ri-add-line mr-1"></i>添加费用项
          </el-button>
        </div>
      </div>

      <!-- 自定义费用项 -->
      <div v-if="customFees.length > 0" class="custom-fee-list">
        <div v-for="(fee, index) in customFees" :key="'fee-' + index" class="custom-fee-item">
          <span class="custom-fee-name">{{ fee.name }} ({{ (fee.rate * 100).toFixed(0) }}%)</span>
          <div class="flex items-center gap-3">
            <span class="custom-fee-value">{{ formatNumber(fee.calculatedValue) }}</span>
            <el-button size="small" type="danger" link @click="$emit('remove-fee', index)">
              <i class="ri-delete-bin-line"></i>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 管销后算原料 -->
      <div v-if="calculation.afterOverheadMaterialTotal > 0" class="cost-tip warning">
        <i class="ri-information-line"></i>
        <div class="cost-tip-content">
          管销后算原料: <strong>{{ formatNumber(calculation.afterOverheadMaterialTotal) }}</strong>
        </div>
      </div>

      <!-- 最终成本价 -->
      <div class="cost-final-box">
        <div class="cost-final-label">最终成本价</div>
        <div class="cost-final-value">
          <span v-if="salesType === 'domestic'">{{ formatNumber(calculation.domesticPrice) }} CNY</span>
          <span v-else>{{ formatNumber(calculation.insurancePrice) }} USD</span>
        </div>
        <div class="cost-final-info">
          <span v-if="salesType === 'export'">汇率: {{ formatNumber(calculation.exchangeRate) }} | 保险: 0.3%</span>
          <span v-else>含 {{ vatRatePercent }}% 增值税</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  calculation: { type: Object, required: true },
  customFees: { type: Array, default: () => [] },
  salesType: { type: String, default: 'domestic' },
  vatRate: { type: Number, default: 0.13 }
})

defineEmits(['add-fee', 'remove-fee'])

const vatRatePercent = computed(() => ((props.vatRate || 0.13) * 100).toFixed(0))
</script>
