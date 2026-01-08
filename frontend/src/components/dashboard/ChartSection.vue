<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
    <!-- 左侧图表：报价单对比 (双折线图) -->
    <div class="chart-card group">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center mr-3 shadow-sm">
            <i class="ri-line-chart-line text-base"></i>
          </div>
          <h2 class="text-base font-semibold text-slate-800">成本月度对比</h2>
        </div>
        <div class="flex items-center space-x-4 text-xs text-slate-400">
          <div class="flex items-center">
            <span class="w-6 h-0.5 bg-slate-300 mr-1.5 rounded"></span>
            <span>上月</span>
          </div>
          <div class="flex items-center">
            <span class="w-6 h-0.5 bg-blue-500 mr-1.5 rounded"></span>
            <span>本月</span>
          </div>
        </div>
      </div>
      
      <!-- SVG 折线图 -->
      <div class="h-48 w-full relative flex">
        <div class="flex flex-col justify-between text-xs text-slate-400 pr-2 py-1" style="width: 30px;">
          <span>{{ yAxisLabels[0] }}</span>
          <span>{{ yAxisLabels[1] }}</span>
          <span>{{ yAxisLabels[2] }}</span>
        </div>
        <div class="flex-1 relative">
          <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
            <line x1="0" y1="10" x2="300" y2="10" stroke="#f1f5f9" stroke-width="1" />
            <line x1="0" y1="55" x2="300" y2="55" stroke="#f1f5f9" stroke-width="1" />
            <line x1="0" y1="110" x2="300" y2="110" stroke="#e2e8f0" stroke-width="1" />
            
            <!-- 上月 (灰色虚线) -->
            <polyline :points="lastMonthPoints" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
            <circle :cx="20" :cy="getChartY(weeklyQuotations.lastMonth[0])" r="3" fill="#cbd5e1" />
            <circle :cx="106" :cy="getChartY(weeklyQuotations.lastMonth[1])" r="3" fill="#cbd5e1" />
            <circle :cx="192" :cy="getChartY(weeklyQuotations.lastMonth[2])" r="3" fill="#cbd5e1" />
            <circle :cx="280" :cy="getChartY(weeklyQuotations.lastMonth[3])" r="3" fill="#cbd5e1" />

            <!-- 本月 (蓝色实线) -->
            <path :d="thisMonthPath" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="line-draw"/>
            <circle :cx="20" :cy="getChartY(weeklyQuotations.thisMonth[0])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle :cx="106" :cy="getChartY(weeklyQuotations.thisMonth[1])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle :cx="192" :cy="getChartY(weeklyQuotations.thisMonth[2])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle :cx="280" :cy="getChartY(weeklyQuotations.thisMonth[3])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
          </svg>
          <div class="flex justify-between text-xs text-slate-400 mt-2 px-4">
            <span>{{ xAxisDateLabels[0] }}</span>
            <span>{{ xAxisDateLabels[1] }}</span>
            <span>{{ xAxisDateLabels[2] }}</span>
            <span>{{ xAxisDateLabels[3] }}</span>
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
              :style="{ height: getBarHeight(chartData[index].count) + '%', animationDelay: bar.delay }"
            ></div>
          </div>
          <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[index]?.modelName">{{ chartData[index]?.modelName || '--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  weeklyQuotations: { type: Object, default: () => ({ thisMonth: [0, 0, 0, 0], lastMonth: [0, 0, 0, 0] }) },
  topModels: { type: Array, default: () => [] }
})

const barConfigs = [
  { color: 'bg-blue-500', delay: '0s' },
  { color: 'bg-emerald-500', delay: '0.1s' },
  { color: 'bg-amber-500', delay: '0.2s' },
  { color: 'bg-rose-500', delay: '0.3s' },
  { color: 'bg-purple-500', delay: '0.4s' }
]

const chartData = computed(() => props.topModels.slice(0, 5))

const getBarHeight = (count) => {
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

.bar-grow {
  animation: growUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: bottom;
  transform: scaleY(0);
}
@keyframes growUp {
  to { transform: scaleY(1); }
}

.line-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: dash 1.2s ease-out forwards;
}
@keyframes dash {
  to { stroke-dashoffset: 0; }
}
</style>
