<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
    <!-- 模式 A: 成本管理 (业务员/审核员) -->
    <template v-if="typeof stats.totalCostRecords !== 'undefined'">
      <!-- 卡片 1: 总成本记录数 -->
      <div class="stat-card group hover:border-blue-300">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-blue-500 text-white shadow-blue-200">
              <i class="ri-file-list-3-line text-base sm:text-lg"></i>
            </div>
            <!-- 右上角 Badge -->
            <div class="stat-badge bg-blue-50 text-blue-600">
              <i class="ri-bar-chart-fill text-xs mr-1"></i>
              <span>实时</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value">{{ stats.totalCostRecords || 0 }}</span>
              <span class="stat-unit">条</span>
            </div>
            <h3 class="stat-label mt-1">总成本分析数</h3>
          </div>
        </div>
        <div class="stat-footer">
          <span class="truncate hidden sm:inline">含所有业务已提交记录</span>
        </div>
      </div>

      <!-- 卡片 2: 待审核 -->
      <div class="stat-card group hover:border-orange-300">
        <div class="p-3 sm:p-5 flex-1">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-orange-500 text-white shadow-orange-200">
              <i class="ri-time-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-orange-50 text-orange-600">
              <i class="ri-loader-2-fill text-xs mr-1"></i>
              <span>待处理</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value">{{ stats.pendingReview || 0 }}</span>
              <span class="stat-unit">条</span>
            </div>
            <h3 class="stat-label mt-1">待审核</h3>
          </div>
        </div>
        <div class="stat-footer">
          <span class="text-orange-600 font-medium">等待审核</span>
        </div>
      </div>

      <!-- 卡片 3: 已审核 -->
      <div class="stat-card group hover:border-emerald-300">
        <div class="p-3 sm:p-5 flex-1">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-emerald-500 text-white shadow-emerald-200">
              <i class="ri-checkbox-circle-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-emerald-50 text-emerald-600">
              <i class="ri-check-double-line text-xs mr-1"></i>
              <span>已完成</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value">{{ stats.approved || 0 }}</span>
              <span class="stat-unit">条</span>
            </div>
            <h3 class="stat-label mt-1">已审核</h3>
          </div>
        </div>
        <div class="stat-footer">
          <span class="text-emerald-600 font-medium">审核通过</span>
        </div>
      </div>

      <!-- 卡片 4: 退回中 -->
      <div class="stat-card group hover:border-rose-300">
        <div class="p-3 sm:p-5 flex-1">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-rose-500 text-white shadow-rose-200">
              <i class="ri-arrow-go-back-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-rose-50 text-rose-600">
              <i class="ri-alert-line text-xs mr-1"></i>
              <span>需修改</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value">{{ stats.returned || 0 }}</span>
              <span class="stat-unit">条</span>
            </div>
            <h3 class="stat-label mt-1">已退回</h3>
          </div>
        </div>
        <div class="stat-footer">
          <span class="text-rose-600 font-medium">重新提交</span>
        </div>
      </div>
    </template>

    <!-- 模式 B: 基础数据 (采购/生产) -->
    <template v-else-if="typeof stats.packagingCount !== 'undefined'">
      <!-- 卡片 1: 原料 SKU -->
      <div class="stat-card stat-card-primary group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-blue-500 text-white shadow-blue-200">
              <i class="ri-stack-line text-base sm:text-lg"></i>
            </div>
            <!-- 可以显示最近更新时间 -->
            <div class="stat-badge bg-blue-50 text-blue-600 hidden sm:flex" v-if="materialsLastUpdatedText">
              <i class="ri-refresh-line text-xs mr-0.5"></i>
              <span>{{ materialsLastUpdatedText }}</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ stats.activeMaterials || 0 }}</span>
              <span class="stat-unit text-slate-500">条</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">原料 SKU</h3>
          </div>
        </div>
        <div class="stat-footer bg-blue-50/50 border-t border-blue-100">
          <span class="stat-time text-blue-600">
            数据库记录
            <span class="ml-auto font-medium">活跃</span>
          </span>
        </div>
      </div>

      <!-- 卡片 2: 在售型号 -->
      <div class="stat-card stat-card-indigo group">
        <div class="p-3 sm:p-5 flex-1">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-indigo-500 text-white shadow-indigo-200">
              <i class="ri-grid-fill text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-indigo-50 text-indigo-600 hidden sm:flex">
              <i class="ri-price-tag-3-fill text-xs mr-0.5"></i>
              <span>在售</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ stats.activeModels || 0 }}</span>
              <span class="stat-unit text-slate-500">款</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">在售型号</h3>
          </div>
        </div>
        <div class="stat-footer bg-indigo-50/50 border-t border-indigo-100">
          <span class="stat-time text-indigo-600">
            折叠 / 杯型 / 平面 / 半面罩
          </span>
        </div>
      </div>

      <!-- 卡片 3: 包材管理 -->
      <div class="stat-card stat-card-warning group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-amber-500 text-white shadow-amber-200">
              <i class="ri-box-3-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-amber-50 text-amber-600 hidden sm:flex">
                <i class="ri-database-2-line text-xs mr-0.5"></i>
                <span>包材</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ stats.packagingCount || 0 }}</span>
              <span class="stat-unit text-slate-500">款</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">已配置包材</h3>
          </div>
        </div>
        <div class="stat-footer bg-amber-50/50 border-t border-amber-100">
          <span class="stat-time text-amber-600">
            纸箱 / 彩盒 / 胶袋 / 说明书
          </span>
        </div>
      </div>

      <!-- 卡片 4: 工序管理 -->
      <div class="stat-card stat-card-success group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-emerald-500 text-white shadow-emerald-200">
              <i class="ri-settings-4-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-emerald-50 text-emerald-600 hidden sm:flex">
              <i class="ri-tools-line text-xs mr-0.5"></i>
              <span>工序</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ stats.processCount || 0 }}</span>
              <span class="stat-unit text-slate-500">款</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">已配置工序</h3>
          </div>
        </div>
        <div class="stat-footer bg-emerald-50/50 border-t border-emerald-100">
          <span class="stat-time text-emerald-600">
            生产流程工序配置
          </span>
        </div>
      </div>
    </template>

    <!-- 模式 C: 运营概览 (管理员) - 恢复原版 -->
    <template v-else>
      <!-- 卡片 1: 本月报价单 -->
      <div class="stat-card stat-card-primary group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-blue-500 text-white shadow-blue-200">
              <i class="ri-file-list-3-line text-base sm:text-lg"></i>
            </div>
            <div v-if="stats.growthRate !== null" :class="['stat-badge', 'bg-blue-50', 'text-blue-600', 'hidden', 'sm:flex']">
              <i :class="stats.growthRate >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'" class="text-xs mr-0.5"></i>
              <span>{{ Math.abs(stats.growthRate) }}%</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ (stats.monthlyQuotations || 0).toLocaleString() }}</span>
              <span class="stat-unit text-slate-500">单</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">本月报价单</h3>
          </div>
        </div>
        <div class="stat-footer bg-blue-50/50 border-t border-blue-100">
          <span class="stat-time text-blue-600">
            环比上月
            <span class="ml-auto font-medium">
              {{ stats.growthRate > 0 ? '+' : ''}}{{ stats.growthRate }}%
            </span>
          </span>
        </div>
      </div>

      <!-- 卡片 2: 法规标准 -->
      <div class="stat-card stat-card-warning group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-amber-500 text-white shadow-amber-200">
              <i class="ri-government-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-amber-50 text-amber-600 hidden sm:flex">
              <i class="ri-shield-check-line text-xs mr-0.5"></i>
              <span>合规</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ totalRegulations }}</span>
              <span class="stat-unit text-slate-500">项</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">法规标准</h3>
          </div>
        </div>
        <div class="stat-footer bg-amber-50/50 border-t border-amber-100">
          <span class="stat-time text-amber-600 truncate" :title="regulationNames">
            覆盖 {{ regulationNames }}
          </span>
        </div>
      </div>

      <!-- 卡片 3: 原料 SKU -->
      <div class="stat-card stat-card-success group">
        <div class="p-3 sm:p-5 flex-1 relative">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-emerald-500 text-white shadow-emerald-200">
              <i class="ri-stack-line text-base sm:text-lg"></i>
            </div>
            <div class="stat-badge bg-emerald-50 text-emerald-600 hidden sm:flex">
              <i class="ri-database-2-line text-xs mr-0.5"></i>
              <span>活跃</span>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ (stats.activeMaterials || 0).toLocaleString() }}</span>
              <span class="stat-unit text-slate-500">条</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">原料 SKU</h3>
          </div>
        </div>
        <div class="stat-footer bg-emerald-50/50 border-t border-emerald-100">
          <span class="stat-time text-emerald-600">
            数据库记录
            <span class="ml-auto font-medium" v-if="materialsLastUpdatedText">{{ materialsLastUpdatedText }}</span>
          </span>
        </div>
      </div>

      <!-- 卡片 4: 在售型号 -->
      <div class="stat-card stat-card-indigo group">
        <div class="p-3 sm:p-5 flex-1">
          <div class="flex items-start justify-between mb-2 sm:mb-3">
            <div class="stat-icon bg-indigo-500 text-white shadow-indigo-200">
              <i class="ri-grid-fill text-base sm:text-lg"></i>
            </div>
          </div>
          <div class="mt-2 sm:mt-4">
            <div class="flex items-baseline">
              <span class="stat-value text-slate-800">{{ stats.activeModels || 0 }}</span>
              <span class="stat-unit text-slate-500">款</span>
            </div>
            <h3 class="stat-label text-slate-600 mt-1">在售型号</h3>
          </div>
        </div>
        <div class="stat-footer bg-indigo-50/50 border-t border-indigo-100">
          <span class="stat-time text-indigo-600">
            折叠 / 杯型 / 平面 / 半面罩
          </span>
        </div>
      </div>
    </template>
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
  @apply flex items-center text-xs font-medium px-2 py-1 rounded-full;
}
.stat-time {
  @apply flex items-center text-xs text-slate-400;
}
</style>
