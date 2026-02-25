<template>
  <div class="cost-detail-page review-detail-content"> <!-- 应用审核详情样式容器 -->
    <CostPageHeader :title="`报价单详情 ${quotation.quotation_no ? '- ' + quotation.quotation_no : ''}`" :show-back="true" @back="$router.back()">
      <template #after-title>
         <div class="flex items-center gap-2 ml-4">
           <StatusBadge type="status" :value="quotation.status" />
           <StatusBadge type="sales_type" :value="quotation.sales_type" />
         </div>
      </template>
      <template #actions>
        <ActionButton type="export" @click="handleExport" :disabled="exporting">导出 Excel</ActionButton>
        <ActionButton type="profit" @click="profitDialogVisible = true">利润分析</ActionButton>
        <ActionButton 
            v-if="canSetStandard" 
            type="default" 
            @click="setAsStandardCost"
            :disabled="settingStandardCost"
          >
            设为标准成本
          </ActionButton>
        <ActionButton type="edit" @click="goToEdit" v-if="canEdit">编辑</ActionButton>
      </template>
    </CostPageHeader>
    
    <div class="mt-6" v-loading="loading">
      <!-- Main Content Layout -->
      <div class="max-w-[1600px] mx-auto px-6 py-6" v-if="quotation && quotation.id">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Column (Main Details) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Info Card (Simplified) -->
            <QuotationInfoCard :quotation="quotation" />

            <!-- Freight Info Card -->
            <FreightInfoCard :quotation="quotation" :shipping-info="shippingInfo" />

            <!-- Tabs (Reuse existing component, Strictly ReadOnly) -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <!-- 
                 Note: We pass the items directly. 
                 CostDetailTabs computes subtotals internally based on these arrays.
               -->
               <CostDetailTabs 
                 :materials="items.materials"
                 :processes="items.processes"
                 :packaging="items.packaging"
                 :process-coefficient="quotation.process_coefficient"
                 :read-only="true"
               />
            </div>
          </div>

          <!-- Right Column (Sticky Summary + Sales Info) -->
          <div class="lg:col-span-4 sticky top-24">
            <CostSummaryPanel 
              :quotation="quotation" 
              :items="items"
            />
          </div>
        </div>
      </div>

       <!-- Profit Calculator Dialog -->
      <ProfitCalculatorDialog 
        v-model="profitDialogVisible" 
        :initial-cost-price="parseFloat(quotation.final_price) || 0"
        :initial-quantity="quotation.quantity || 0"
        :currency="quotation.currency || 'CNY'"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/store/config'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import { useQuotationDetail } from './composables/useQuotationDetail'
import QuotationInfoCard from './components/Detail/QuotationInfoCard.vue'
import FreightInfoCard from './components/Detail/FreightInfoCard.vue'
import CostSummaryPanel from './components/Detail/CostSummaryPanel.vue'
import CostDetailTabs from './components/CostDetailTabs.vue'
import ProfitCalculatorDialog from '@/components/ProfitCalculatorDialog.vue'
import '@/styles/review-dialog.css'

defineOptions({ name: 'CostDetail' })

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const profitDialogVisible = ref(false)

const {
  loading,
  quotation,
  items,
  calculation,
  customProfitTiers,
  shippingInfo,
  isAdminOrReviewer,
  canEdit,
  settingStandardCost,
  exporting,
  loadDetail,
  setAsStandardCost,
  handleExport
} = useQuotationDetail(route.params.id)

const canSetStandard = computed(() => {
  return isAdminOrReviewer.value && 
         quotation.value.packaging_config_id && 
         quotation.value.status === 'approved'
})

const allProfitTiers = computed(() => {
  if (!calculation.value || !calculation.value.profitTiers) return []
  const systemTiers = calculation.value.profitTiers.map(tier => ({ ...tier, isCustom: false }))
  const customTiers = customProfitTiers.value.map(tier => ({ ...tier, isCustom: true }))
  const all = [...systemTiers, ...customTiers]
  all.sort((a, b) => a.profitRate - b.profitRate)
  return all
})

const goToEdit = () => {
  router.push(`/cost/edit/${route.params.id}`)
}

onMounted(async () => {
  await configStore.loadConfig()
  loadDetail()
})
</script>

<style scoped>
/* No extra styles needed */
</style>
