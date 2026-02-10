<template>
  <div class="cost-compare-container">
    <CostPageHeader title="成本对比分析" :show-back="true" @back="goBack" />

    <div v-loading="loading" class="compare-content">
      <!-- 对比概览 -->
      <CompareOverview
        :quotations="compareData.quotations"
        :calculations="compareData.calculations"
        :get-all-profit-tiers="getAllProfitTiers"
        :format-number="formatNumber"
        @print="handlePrint"
        @export="handleExport"
      />

      <!-- 分栏对比 -->
      <CompareTable
        :quotations="compareData.quotations"
        :items="compareData.items"
        :calculations="compareData.calculations"
        :get-status-type="getStatusType"
        :get-status-text="getStatusText"
        :format-number="formatNumber"
      />
    </div>
  </div>
</template>

<script setup>
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import CompareOverview from './components/compare/CompareOverview.vue'
import CompareTable from './components/compare/CompareTable.vue'
import { useCostCompare } from './components/compare/useCostCompare.js'

const {
  loading,
  compareData,
  goBack,
  getStatusType,
  getStatusText,
  getAllProfitTiers,
  handlePrint,
  handleExport,
  formatNumber
} = useCostCompare()
</script>

<style scoped>
.cost-compare-container {
  /* padding 由 MainLayout 提供 */
}

.compare-content {
  min-height: 400px;
}

/* 打印样式 */
@media print {
  .compare-card,
  .overview-actions {
    display: none !important;
  }

  .overview-card {
    page-break-inside: avoid;
  }

  .config-item {
    page-break-inside: avoid;
  }
}
</style>
