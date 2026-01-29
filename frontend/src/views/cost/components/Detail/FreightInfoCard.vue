<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6">
    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <div class="w-1 h-4 bg-orange-500 rounded-full"></div>
      运费概览
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
      <!-- Row 1: Sales Type & Freight Total -->
      <div class="info-group">
        <label class="text-xs text-gray-400 block mb-1">销售类型</label>
        <div class="flex items-center">
            <span class="px-2 py-0.5 rounded text-xs font-medium" 
              :class="quotation.sales_type === 'domestic' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'">
              {{ quotation.sales_type === 'domestic' ? '内销 (RMB)' : '外销 (USD)' }}
            </span>
        </div>
      </div>

      <div class="info-group">
         <label class="text-xs text-gray-400 block mb-1">运费总价</label>
         <div class="text-sm font-medium text-gray-700">¥{{ formatNumber(quotation.freight_total) }}</div>
      </div>

      <!-- Row 2: Shipping Method & Freight Included -->
       <div class="info-group" v-if="quotation.sales_type === 'export'">
        <label class="text-xs text-gray-400 block mb-1">货运方式</label>
        <div class="text-sm font-medium text-gray-700">
           {{ formatShippingMethod(quotation.shipping_method) }} 
           <span v-if="quotation.port" class="text-gray-500 font-normal">({{ quotation.port }})</span>
        </div>
      </div>
      <div class="info-group" v-else>
         <div class="hidden md:block"></div>
      </div>

      <div class="info-group">
        <label class="text-xs text-gray-400 block mb-1">运费计入成本</label>
        <div class="text-sm font-medium" :class="quotation.include_freight_in_base ? 'text-green-600' : 'text-gray-400'">
          {{ quotation.include_freight_in_base ? '是' : '否' }}
        </div>
      </div>

      <!-- Row 3: Cartons & CBM -->
      <div class="info-group">
        <label class="text-xs text-gray-400 block mb-1">总箱数</label>
        <div class="text-sm font-medium text-gray-700">{{ shippingInfo.cartons || '-' }}</div>
      </div>
      <div class="info-group">
        <label class="text-xs text-gray-400 block mb-1">总体积 (CBM)</label>
        <div class="text-sm font-medium text-gray-700">{{ shippingInfo.cbm || '-' }}</div>
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
