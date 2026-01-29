<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
    <!-- 左侧图表：成本月度对比 (双柱对比图) -->
    <div class="chart-card group">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center mr-3 shadow-sm">
            <i class="ri-bar-chart-grouped-line text-base"></i>
          </div>
          <h2 class="text-base font-semibold text-slate-800">成本月度对比</h2>
        </div>
        <div class="flex items-center space-x-4 text-xs text-slate-400">
          <div class="flex items-center">
            <span class="w-3 h-3 bg-slate-300 rounded mr-1.5"></span>
            <span>上月</span>
          </div>
          <div class="flex items-center">
            <span class="w-3 h-3 bg-blue-500 rounded mr-1.5"></span>
            <span>本月</span>
          </div>
        </div>
      </div>
      
      <!-- 双柱对比图 -->
      <div class="h-48 w-full relative flex">
        <!-- Y轴标签 -->
        <div class="flex flex-col justify-between text-xs text-slate-400 pr-3 py-1" style="width: 36px;">
          <span>{{ yAxisLabels[0] }}</span>
          <span>{{ yAxisLabels[1] }}</span>
          <span>{{ yAxisLabels[2] }}</span>
        </div>
        <!-- 柱状图区域 -->
        <div class="flex-1 relative">
          <!-- 网格线 -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div class="border-b border-slate-100"></div>
            <div class="border-b border-slate-100"></div>
            <div class="border-b border-slate-200"></div>
          </div>
          <!-- 柱状图组 -->
          <div class="relative h-full flex items-end justify-around px-2 pb-6">
            <div 
              v-for="(week, idx) in 4" 
              :key="idx" 
              class="twin-pillar-group flex items-end gap-1.5 relative"
              @mouseenter="activeWeek = idx"
              @mouseleave="activeWeek = null"
            >
              <!-- 上月柱 -->
              <div class="pillar-wrapper">
                <div 
                  class="pillar pillar-last"
                  :style="{ height: getBarHeight(weeklyQuotations.lastMonth[idx]) + '%', animationDelay: (idx * 0.1) + 's' }"
                ></div>
              </div>
              <!-- 本月柱 -->
              <div class="pillar-wrapper">
                <div 
                  :class="['pillar pillar-this', { 'pillar-glow': weeklyQuotations.thisMonth[idx] > weeklyQuotations.lastMonth[idx] }]"
                  :style="{ height: getBarHeight(weeklyQuotations.thisMonth[idx]) + '%', animationDelay: (idx * 0.1 + 0.05) + 's' }"
                ></div>
              </div>
              <!-- 悬浮提示 -->
              <Transition name="tooltip-fade">
                <div v-if="activeWeek === idx" class="pillar-tooltip">
                  <div class="tooltip-header">{{ xAxisDateLabels[idx] }}</div>
                  <div class="tooltip-row">
                    <span class="tooltip-dot bg-slate-400"></span>
                    <span>上月：</span>
                    <span class="tooltip-value">{{ weeklyQuotations.lastMonth[idx] }}</span>
                  </div>
                  <div class="tooltip-row">
                    <span class="tooltip-dot bg-blue-500"></span>
                    <span>本月：</span>
                    <span class="tooltip-value text-blue-600">{{ weeklyQuotations.thisMonth[idx] }}</span>
                  </div>
                  <div v-if="weeklyQuotations.thisMonth[idx] !== weeklyQuotations.lastMonth[idx]" class="tooltip-diff">
                    <span :class="weeklyQuotations.thisMonth[idx] > weeklyQuotations.lastMonth[idx] ? 'text-rose-500' : 'text-emerald-500'">
                      {{ weeklyQuotations.thisMonth[idx] > weeklyQuotations.lastMonth[idx] ? '↑' : '↓' }}
                      {{ Math.abs(weeklyQuotations.thisMonth[idx] - weeklyQuotations.lastMonth[idx]) }}
                    </span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <!-- X轴标签 -->
          <div class="absolute bottom-0 left-0 right-0 flex justify-around text-xs text-slate-400 px-2">
            <span v-for="(label, idx) in xAxisDateLabels" :key="idx" class="text-center">{{ label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧图表：型号分布 (柱状图) -->
    <div class="chart-card group">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center mr-3 shadow-sm">
            <i class="ri-bar-chart-line text-base"></i>
          </div>
          <h2 class="text-base font-semibold text-slate-800">本月型号分布</h2>
        </div>
        <span class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Top 5</span>
      </div>
      
      <div class="h-48 w-full flex items-end justify-between space-x-6 pt-6 px-2">
        <div v-for="(bar, index) in barConfigs" :key="index" class="flex flex-col items-center flex-1 group relative">
          <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[index]?.count || '' }}</span>
          <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
            <div 
              v-if="chartData[index]" 
              :class="['absolute bottom-0 w-full rounded-t-md bar-grow', bar.color]"
              :style="{ height: getModelBarHeight(chartData[index].count) + '%', animationDelay: bar.delay }"
            ></div>
          </div>
          <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[index]?.modelName">{{ chartData[index]?.modelName || '--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  weeklyQuotations: { type: Object, default: () => ({ thisMonth: [0, 0, 0, 0], lastMonth: [0, 0, 0, 0] }) },
  topModels: { type: Array, default: () => [] }
})

const activeWeek = ref(null) // 当前悬浮的周索引

const barConfigs = [
  { color: 'bg-blue-500', delay: '0s' },
  { color: 'bg-emerald-500', delay: '0.1s' },
  { color: 'bg-amber-500', delay: '0.2s' },
  { color: 'bg-rose-500', delay: '0.3s' },
  { color: 'bg-purple-500', delay: '0.4s' }
]

const chartData = computed(() => props.topModels.slice(0, 5))

const getBarHeight = (value) => {
  if (chartMaxValue.value === 0) return 5 // 最小高度
  return Math.max(5, Math.round((value / chartMaxValue.value) * 100))
}

const getModelBarHeight = (count) => {
  if (props.topModels.length === 0) return 0
  const maxCount = Math.max(...props.topModels.map(m => m.count))
  if (maxCount === 0) return 0
  return Math.max(10, Math.round((count / maxCount) * 100))
}

const chartMaxValue = computed(() => {
  const allValues = [...props.weeklyQuotations.thisMonth, ...props.weeklyQuotations.lastMonth]
  return Math.max(...allValues, 1)
})

const getChartY = (value) => {
  if (chartMaxValue.value === 0) return 110
  return 110 - (value / chartMaxValue.value) * 100
}

const thisMonthPath = computed(() => {
  const data = props.weeklyQuotations.thisMonth
  const points = [
    `20,${getChartY(data[0])}`,
    `106,${getChartY(data[1])}`,
    `192,${getChartY(data[2])}`,
    `280,${getChartY(data[3])}`
  ]
  return `M${points.join(' L')}`
})

const lastMonthPoints = computed(() => {
  const data = props.weeklyQuotations.lastMonth
  return [
    `20,${getChartY(data[0])}`,
    `106,${getChartY(data[1])}`,
    `192,${getChartY(data[2])}`,
    `280,${getChartY(data[3])}`
  ].join(' ')
})

const yAxisLabels = computed(() => {
  const max = chartMaxValue.value
  if (max <= 1) return [0, 1]
  const mid = Math.round(max / 2)
  return [max, mid, 0]
})

const xAxisDateLabels = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return [
    `${month}/1-7`,
    `${month}/8-14`,
    `${month}/15-21`,
    `${month}/22-${lastDay}`
  ]
})
</script>

<style scoped>
.chart-card {
  @apply bg-white rounded-xl border border-slate-200 p-6;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.chart-card:hover {
  @apply border-slate-300;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.06);
}

/* 双柱对比图样式 */
.twin-pillar-group {
  cursor: pointer;
}
.pillar-wrapper {
  @apply relative;
  width: 20px;
  height: 140px;
}
.pillar {
  @apply absolute bottom-0 w-full rounded-t-md;
  animation: pillarGrow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: bottom;
  transform: scaleY(0);
}
.pillar-last {
  @apply bg-slate-300;
}
.pillar-this {
  @apply bg-blue-500;
  transition: box-shadow 0.3s ease;
}
.pillar-glow {
  box-shadow: 0 0 12px 2px rgba(59, 130, 246, 0.4);
}
@keyframes pillarGrow {
  to { transform: scaleY(1); }
}

/* 悬浮提示样式 */
.pillar-tooltip {
  @apply absolute z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 120px;
  pointer-events: none;
}
.pillar-tooltip::after {
  content: '';
  @apply absolute bg-white border-b border-r border-slate-200;
  width: 8px;
  height: 8px;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}
.tooltip-header {
  @apply text-xs font-semibold text-slate-700 mb-2 pb-1 border-b border-slate-100;
}
.tooltip-row {
  @apply flex items-center text-xs text-slate-600 mb-1;
}
.tooltip-dot {
  @apply w-2 h-2 rounded-full mr-2 flex-shrink-0;
}
.tooltip-value {
  @apply font-semibold ml-auto;
}
.tooltip-diff {
  @apply text-xs font-bold mt-1 pt-1 border-t border-slate-100 text-center;
}

/* 悬浮提示过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* 型号分布柱状图 */
.bar-grow {
  animation: growUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: bottom;
  transform: scaleY(0);
}
@keyframes growUp {
  to { transform: scaleY(1); }
}
</style>
