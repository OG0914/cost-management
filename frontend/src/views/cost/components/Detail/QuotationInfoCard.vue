<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
      基础信息
    </h3>
    
    <!-- 使用 Flex 布局实现左右两列垂直堆叠，确保字段严格位于指定字段下方 -->
    <div class="flex flex-col md:flex-row gap-8">
      
      <!-- Left Column -->
      <div class="flex-1 space-y-6">
        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">客户名称</label>
           <div class="text-sm font-medium text-gray-700">{{ quotation.customer_name }}</div>
        </div>
        
        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">产品型号</label>
           <div class="text-sm font-medium text-gray-700">{{ quotation.model_name }}</div>
        </div>

        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">订单数量</label>
           <div class="text-sm font-medium text-gray-900">{{ formatQuantity(quotation.quantity) }} PCS</div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="flex-1 space-y-6">
        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">客户地区</label>
           <div class="text-sm font-medium text-gray-700">{{ quotation.customer_region }}</div>
        </div>

        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">包装方式</label>
           <div class="text-sm font-medium text-gray-700" v-if="quotation.packaging_config_name">
             {{ quotation.packaging_config_name }}
             <span class="text-gray-400 font-normal ml-1">({{ quotation.pc_per_bag }}片/袋, {{ quotation.bags_per_box }}袋/盒, {{ quotation.boxes_per_carton }}盒/箱)</span>
           </div>
           <div v-else class="text-sm text-gray-400">-</div>
        </div>

        <div class="info-group">
           <label class="text-xs text-gray-400 block mb-1">运费/片 (CNY)</label>
           <div class="text-sm font-medium text-gray-900">{{ formatNumber(quotation.freight_per_unit) }}</div>
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
