<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
    <!-- 卡片 1: 本月报价单 - 主要指标，突出显示 -->
    <div class="stat-card stat-card-primary group">
      <div class="p-3 sm:p-5 flex-1 relative">
        <div class="flex items-start justify-between mb-2 sm:mb-3">
          <div class="stat-icon bg-blue-500 text-white shadow-blue-200">
            <i class="ri-file-list-3-line text-base sm:text-lg"></i>
          </div>
          <div v-if="stats.growthRate" class="stat-trend stat-trend-up hidden sm:flex">
            <i class="ri-arrow-up-line text-xs"></i>
            <span>{{ stats.growthRate }}%</span>
          </div>
        </div>
        <div class="mt-2 sm:mt-4">
          <div class="flex items-baseline">
            <span class="stat-value">{{ stats.monthlyQuotations.toLocaleString() }}</span>
            <span class="stat-unit">单</span>
          </div>
          <h3 class="stat-label mt-1">本月报价单</h3>
        </div>
        <!-- 迷你趋势线 -->
        <div class="absolute bottom-3 right-4 opacity-30 group-hover:opacity-50 transition-opacity hidden sm:block">
          <svg width="48" height="24" viewBox="0 0 48 24" class="text-blue-500">
            <polyline points="0,20 12,14 24,16 36,8 48,4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="stat-footer">
        <span class="hidden sm:inline">环比上月</span>
        <span class="sm:hidden">环比</span>
        <span class="text-slate-600 font-medium">{{ stats.growthRate ? `+${stats.growthRate}%` : '--' }}</span>
      </div>
    </div>

    <!-- 卡片 2: 法规总览 -->
    <div class="stat-card group">
      <div class="p-3 sm:p-5 flex-1">
        <div class="flex items-start justify-between mb-2 sm:mb-3">
          <div class="stat-icon bg-amber-500 text-white shadow-amber-200">
            <i class="ri-government-line text-base sm:text-lg"></i>
          </div>
          <div class="stat-badge hidden sm:flex">
            <i class="ri-shield-check-line text-xs mr-0.5"></i>
            <span>合规</span>
          </div>
        </div>
        <div class="mt-2 sm:mt-4">
          <div class="flex items-baseline">
            <span class="stat-value">{{ totalRegulations }}</span>
            <span class="stat-unit">项</span>
          </div>
          <h3 class="stat-label mt-1">法规标准</h3>
        </div>
      </div>
      <div class="stat-footer">
        <span class="truncate flex-1" :title="regulationNames"><span class="hidden sm:inline">覆盖</span> {{ regulationNames }}</span>
      </div>
    </div>

    <!-- 卡片 3: 有效原料SKU -->
    <div class="stat-card group">
      <div class="p-3 sm:p-5 flex-1">
        <div class="flex items-start justify-between mb-2 sm:mb-3">
          <div class="stat-icon bg-emerald-500 text-white shadow-emerald-200">
            <i class="ri-database-2-line text-base sm:text-lg"></i>
          </div>
          <div class="stat-time hidden sm:flex">
            <i class="ri-time-line text-xs mr-0.5"></i>
            <span>{{ materialsLastUpdatedText }}</span>
          </div>
        </div>
        <div class="mt-2 sm:mt-4">
          <div class="flex items-baseline">
            <span class="stat-value">{{ stats.activeMaterials.toLocaleString() }}</span>
            <span class="stat-unit">条</span>
          </div>
          <h3 class="stat-label mt-1">原料 SKU</h3>
        </div>
      </div>
      <div class="stat-footer">
        <span class="hidden sm:inline">数据库记录</span>
        <span class="sm:hidden">状态</span>
        <span class="text-emerald-600 font-medium">活跃</span>
      </div>
    </div>

    <!-- 卡片 4: 在售型号 -->
    <div class="stat-card group">
      <div class="p-3 sm:p-5 flex-1">
        <div class="flex items-start justify-between mb-2 sm:mb-3">
          <div class="stat-icon bg-indigo-500 text-white shadow-indigo-200">
            <i class="ri-layout-grid-line text-base sm:text-lg"></i>
          </div>
        </div>
        <div class="mt-2 sm:mt-4">
          <div class="flex items-baseline">
            <span class="stat-value">{{ stats.activeModels }}</span>
            <span class="stat-unit">款</span>
          </div>
          <h3 class="stat-label mt-1">在售型号</h3>
        </div>
      </div>
      <div class="stat-footer">
        <span class="truncate hidden sm:inline">折叠 / 杯型 / 平面 / 半面罩</span>
        <span class="truncate sm:hidden">全部类型</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, required: true },
  regulations: { type: Array, default: () => [] }
})

const totalRegulations = computed(() => props.regulations.length)

const regulationNames = computed(() => {
  return props.regulations.map(r => r.name).slice(0, 3).join('/') || '--'
})

const materialsLastUpdatedText = computed(() => {
  if (!props.stats.materialsLastUpdated) return '--'
  const updated = new Date(props.stats.materialsLastUpdated)
  const now = new Date()
  const diffMs = now - updated
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return updated.toLocaleDateString('zh-CN')
})
</script>

<style scoped>
.stat-card {
  @apply bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  @apply border-slate-300;
}
.stat-card-primary {
  @apply border-blue-200 bg-gradient-to-br from-white to-blue-50/30;
}
.stat-card-primary:hover {
  @apply border-blue-300;
  box-shadow: 0 8px 24px -4px rgba(59, 130, 246, 0.15);
}
.stat-icon {
  @apply w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center;
  box-shadow: 0 4px 12px -2px currentColor;
}
.stat-value {
  @apply text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight;
  font-variant-numeric: tabular-nums;
}
.stat-unit {
  @apply text-xs sm:text-sm font-medium text-slate-400 ml-1;
}
.stat-label {
  @apply text-xs sm:text-sm text-slate-500 font-medium;
}
.stat-footer {
  @apply bg-slate-50/80 px-3 py-2 sm:px-5 sm:py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500;
}
.stat-trend {
  @apply flex items-center text-xs font-semibold px-2 py-1 rounded-full;
}
.stat-trend-up {
  @apply bg-emerald-50 text-emerald-600;
}
.stat-trend-down {
  @apply bg-red-50 text-red-600;
}
.stat-badge {
  @apply flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full;
}
.stat-time {
  @apply flex items-center text-xs text-slate-400;
}
</style>
