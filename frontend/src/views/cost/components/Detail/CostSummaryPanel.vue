<template>
  <div class="space-y-6">
    <!-- Final Price Card (White Theme) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
      
      <!-- Card Title -->
      <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
        价格明细
      </h3>

      <div class="relative z-10">
        <!-- Top Section: Base Cost and Overhead (Swapped positions) -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- Base Cost (Now First) -->
          <div class="bg-gray-50 rounded p-3 text-center">
            <div class="text-gray-700 text-xs mb-1 flex items-center justify-center gap-1">
              基础成本
              <el-tooltip 
                content="基础成本 = 原料成本 + 工序成本 + 包材成本" 
                placement="top"
                effect="dark"
              >
                <el-icon :size="12" class="text-gray-400 cursor-help hover:text-blue-500 transition-colors">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div class="font-bold text-gray-800">{{ formatNumber(quotation.base_cost) }}</div>
          </div>

          <!-- Overhead Price (Now Second) -->
          <div class="bg-gray-50 rounded p-3 text-center">
            <div class="text-gray-700 text-xs mb-1 flex items-center justify-center gap-1">
              管销价
              <el-tooltip 
                :content="overheadTooltip"
                placement="top"
                effect="dark"
              >
                <el-icon :size="12" class="text-gray-400 cursor-help hover:text-blue-500 transition-colors">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div class="font-bold text-gray-800">{{ formatNumber(quotation.overhead_price) }}</div>
          </div>
        </div>

        <!-- Bottom Section: Final Price -->
        <div class="text-center pt-2">
            <div class="text-gray-500 text-xs font-medium mb-1">最终成本价</div>
            <div class="text-4xl font-bold tracking-tight text-blue-600 mb-2">
            {{ formatNumber(quotation.final_price) }}
            <span class="text-lg font-normal text-gray-400">{{ quotation.currency }}</span>
            </div>
            
            <div class="flex justify-center items-center gap-2 text-xs text-gray-400">
                <span v-if="quotation.sales_type === 'export'">汇率: {{ formatNumber(exchangeRate || 7.2) }}</span>
                <span v-else>含税: {{ ((quotation.vat_rate || 0.13) * 100).toFixed(0) }}%</span>
                <span class="text-gray-300">|</span>
                <span>保险价: 0.3%</span>
            </div>
        </div>
      </div>
    </div>

    <!-- Profit Analysis (Full List) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5" v-if="profitTiers && profitTiers.length">
      <h3 class="text-sm font-semibold text-gray-900 mb-2">预期利润</h3>
      <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">

        <div v-for="tier in profitTiers" :key="tier.profitPercentage" 
          class="flex justify-between items-center p-2 rounded hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-default group">
          
          <div class="flex items-center gap-2">
             <span class="text-gray-700 font-bold text-sm">{{ tier.profitPercentage }}</span>
             <span class="text-[10px] px-1 py-0.5 bg-orange-50 text-orange-400 rounded scale-90 origin-left" v-if="tier.isCustom">自定义</span>
          </div>

          <div class="text-right flex items-center gap-2">
              <span class="font-bold text-gray-900">{{ formatNumber(tier.price) }} <span class="text-xs font-normal text-gray-400">{{ quotation.currency }}</span></span>
              <span class="text-[10px] text-gray-400 bg-gray-50 px-1 rounded min-w-[50px] text-center">
                  {{ (tier.price - quotation.final_price) >= 0 ? '+' : '' }}{{ formatNumber(tier.price - quotation.final_price) }}
              </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'
import { QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
  quotation: Object,
  exchangeRate: [Number, String],
  profitTiers: Array,
  overheadRate: Number  // 管销系数 (e.g., 0.20 for 20%)
})

// 动态生成管销价说明
const overheadTooltip = computed(() => {
  const rate = ((props.overheadRate || 0.20) * 100).toFixed(0) // 默认 20%
  if (props.quotation.include_freight_in_base) {
    return `管销价 = (基础成本 + 运费) × (1 - ${rate}%)`
  } else {
    return `管销价 = 基础成本 × (1 - ${rate}%)`
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 4px;
}
</style>
