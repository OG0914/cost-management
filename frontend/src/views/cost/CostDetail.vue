<template>
  <div class="bg-gray-50 min-h-screen">
    <div v-loading="loading">
      <!-- Global Dynamic Header -->
      <CostPageHeader :title="`报价单详情 ${quotation.quotation_no ? '- ' + quotation.quotation_no : ''}`" :show-back="true" @back="$router.back()">
        <template #after-title>
           <el-tag :type="getStatusType(quotation.status)" size="default" effect="plain" round class="ml-2 font-medium">
             {{ getStatusText(quotation.status) }}
           </el-tag>
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
      
      <!-- Content Grid -->
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
                 :materials="items.material.items"
                 :processes="items.process.items"
                 :packaging="items.packaging.items"
                 :process-coefficient="configStore.config.process_coefficient || 1.56"
                 :read-only="true"
               />
            </div>
          </div>

          <!-- Right Column (Sticky Summary + Sales Info) -->
          <div class="lg:col-span-4 sticky top-24">
            <CostSummaryPanel 
              :quotation="quotation"
              :shipping-info="shippingInfo"
              :exchange-rate="calculation?.exchangeRate"
              :overhead-rate="quotation.overhead_rate || calculation?.overheadRate"
              :profit-tiers="allProfitTiers"
              @view-all-profit="profitDialogVisible = true"
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
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import { useQuotationDetail } from './composables/useQuotationDetail'
import QuotationInfoCard from './components/Detail/QuotationInfoCard.vue'
import FreightInfoCard from './components/Detail/FreightInfoCard.vue'
import CostSummaryPanel from './components/Detail/CostSummaryPanel.vue'
import CostDetailTabs from './components/CostDetailTabs.vue'
import ProfitCalculatorDialog from '@/components/ProfitCalculatorDialog.vue'

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

const getStatusType = (status) => {
  const map = { draft: 'info', submitted: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { draft: '草稿', submitted: '已提交', approved: '已审核', rejected: '已退回' }
  return map[status] || status
}

onMounted(async () => {
  await configStore.loadConfig()
  loadDetail()
})
</script>

<style scoped>
/* No extra styles needed */
</style>
