<template>
  <div class="animate-fade-in">
    <!-- 问候语区域 -->
    <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8 relative overflow-hidden flex items-end justify-between group">
      <!-- 装饰水印 -->
      <i class="ri-calendar-check-line absolute -right-6 -bottom-6 text-9xl text-slate-50 pointer-events-none z-0 group-hover:text-slate-100 transition-colors duration-500"></i>
      
      <!-- 左侧装饰条 -->
      <div class="absolute left-0 top-6 bottom-6 w-1 bg-primary-600 rounded-r-full"></div>

      <!-- 左侧文案 -->
      <div class="relative z-10 pl-4">
        <h1 class="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
          {{ greeting }}
        </h1>
<p class="text-slate-500 flex items-center text-m">
  <span class="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
  {{ subGreeting }}
</p>
      </div>

      <!-- 右侧日期排版 -->
      <div class="relative z-10 text-right">
        <div class="flex items-baseline justify-end leading-none text-slate-700">
          <span class="text-4xl font-bold tracking-tighter mr-1">{{ dateDay }}</span>
          <span class="text-3xl font-light text-slate-300 mr-1 italic">/</span>
          <span class="text-2xl font-semibold text-slate-500">{{ dateMonth }}</span>
        </div>
        <div class="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">
          {{ currentWeekDayCN }}
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- 卡片 1: 本月报价单 -->
      <div class="stat-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-5 flex-1">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
              <i class="ri-file-list-3-line text-xl"></i>
            </div>
            <h3 class="text-slate-600 font-medium">本月报价单</h3>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-800">{{ stats.monthlyQuotations.toLocaleString() }}</span>
            <span class="text-sm font-medium text-slate-400">单</span>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">环比增长</span>
          <span v-if="stats.growthRate" class="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            +{{ stats.growthRate }}%
          </span>
          <span v-else class="text-xs text-slate-400">--</span>
        </div>
      </div>

      <!-- 卡片 2: 法规总览 -->
      <div class="stat-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-5 flex-1">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3">
              <i class="ri-government-line text-xl"></i>
            </div>
            <h3 class="text-slate-600 font-medium">法规总览</h3>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-800">{{ totalRegulations }}</span>
            <span class="text-sm font-medium text-slate-400">项标准</span>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">覆盖 {{ regulationNames }}</span>
          <i class="ri-shield-check-line text-slate-400"></i>
        </div>
      </div>

      <!-- 卡片 3: 有效原料SKU -->
      <div class="stat-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-5 flex-1">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3">
              <i class="ri-database-2-line text-xl"></i>
            </div>
            <h3 class="text-slate-600 font-medium">有效原料 SKU</h3>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-800">{{ stats.activeMaterials.toLocaleString() }}</span>
            <span class="text-sm font-medium text-slate-400">条</span>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">最近更新</span>
          <span class="text-xs text-slate-400">{{ materialsLastUpdatedText }}</span>
        </div>
      </div>

      <!-- 卡片 4: 在售型号 -->
      <div class="stat-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-5 flex-1">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
              <i class="ri-layout-grid-line text-xl"></i>
            </div>
            <h3 class="text-slate-600 font-medium">在售型号</h3>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-800">{{ stats.activeModels }}</span>
            <span class="text-sm font-medium text-slate-400">款</span>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">包含 折叠/杯型/平面/半面罩</span>
        </div>
      </div>
    </div>

    <!-- 快捷导航与系统概况 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 快捷导航 -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-6 flex items-center">
          <i class="ri-flashlight-line mr-2 text-yellow-500"></i>
          快捷导航
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickNavButton
            v-for="(nav, index) in quickNavList"
            :key="nav.key"
            :icon="nav.icon"
            :icon-bg-color="nav.iconBgColor"
            :icon-color="nav.iconColor"
            :label="nav.label"
            :badge="nav.key === 'review-pending' ? pendingCount : 0"
            :show-delete="true"
            @click="router.push(nav.route)"
            @delete="confirmRemoveQuickNav(index, nav.label)"
          />
          <!-- 添加按钮 -->
          <QuickNavButton
            v-if="quickNavList.length < 4"
            icon="ri-add-line"
            :is-dashed="true"
            label="添加"
            @click="showNavSelector = true"
          />
        </div>
      </div>

      <!-- 系统概况（仅管理员可见） -->
      <div v-if="isAdmin" class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">系统概况</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div class="flex items-center">
              <i class="ri-database-line text-slate-400 mr-3"></i>
              <span class="text-sm text-slate-600">数据库状态</span>
            </div>
            <span class="flex items-center text-xs font-medium text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {{ systemStatus.database === 'normal' ? '正常' : '异常' }}
            </span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div class="flex items-center">
              <i class="ri-shield-check-line text-slate-400 mr-3"></i>
              <span class="text-sm text-slate-600">最近备份</span>
            </div>
            <span class="text-xs text-slate-500">{{ systemStatus.lastBackup }}</span>
          </div>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <p class="text-xs text-slate-400 text-center">{{ systemStatus.version }}</p>
          </div>
        </div>
      </div>

      <!-- 系统通知（非管理员可见） -->
      <div v-else class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <i class="ri-notification-3-line mr-2 text-blue-500"></i>
          系统通知
        </h2>
        <div class="space-y-3">
          <div v-if="recentActivities.length === 0" class="text-center text-slate-400 py-6">
            <i class="ri-inbox-line text-3xl mb-2"></i>
            <p class="text-sm">暂无通知</p>
          </div>
          <div 
            v-for="(activity, index) in recentActivities" 
            :key="index"
            class="flex items-start p-3 bg-slate-50 rounded-lg"
          >
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
              <i :class="[activity.icon, 'text-blue-600 text-sm']"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-700">{{ activity.content }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷导航选择弹窗 -->
    <el-dialog 
      v-model="showNavSelector" 
      width="700px" 
      align-center
      append-to-body
      :show-close="false"
      class="quick-nav-dialog"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
              <i class="ri-apps-line text-primary-600"></i>
            </div>
            <span class="text-lg font-semibold text-slate-800">添加快捷导航</span>
          </div>
          <button @click="showNavSelector = false" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <i class="ri-close-line text-slate-400 text-xl"></i>
          </button>
        </div>
      </template>
      <p class="text-sm text-slate-500 mb-4">选择要添加到快捷导航的功能</p>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="option in availableNavOptions"
          :key="option.key"
          @click="addQuickNav(option)"
          class="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 hover:shadow-sm transition-all group"
        >
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-transform group-hover:scale-110', option.iconBgColor]">
            <i :class="[option.icon, 'text-xl', option.iconColor]"></i>
          </div>
          <span class="text-sm font-medium text-slate-700 group-hover:text-primary-700">{{ option.label }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="showNavSelector = false" round>取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <!-- 左侧图表：报价单对比 (双折线图) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-slate-800 flex items-center">
            <i class="ri-line-chart-line mr-2 text-blue-500"></i>
            成本月度对比 
          </h2>
          <!-- 图例 -->
          <div class="flex items-center space-x-4 text-xs text-slate-500">
            <div class="flex items-center">
              <span class="w-8 h-0.5 bg-slate-300 border-t border-dashed border-slate-400 mr-1"></span> 上月
            </div>
            <div class="flex items-center">
              <span class="w-8 h-0.5 bg-blue-500 mr-1"></span> 本月
            </div>
          </div>
        </div>
        
        <!-- SVG 折线图 -->
        <div class="h-48 w-full relative flex">
          <!-- Y轴标签 -->
          <div class="flex flex-col justify-between text-xs text-slate-400 pr-2 py-1" style="width: 30px;">
            <span>{{ yAxisLabels[0] }}</span>
            <span>{{ yAxisLabels[1] }}</span>
            <span>{{ yAxisLabels[2] }}</span>
          </div>
          <!-- 图表区域 -->
          <div class="flex-1 relative">
            <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
              <!-- 网格线 -->
              <line x1="0" y1="10" x2="300" y2="10" stroke="#f1f5f9" stroke-width="1" />
              <line x1="0" y1="55" x2="300" y2="55" stroke="#f1f5f9" stroke-width="1" />
              <line x1="0" y1="110" x2="300" y2="110" stroke="#e2e8f0" stroke-width="1" />
              
              <!-- 上月 (灰色虚线) -->
              <polyline :points="lastMonthPoints" 
                        fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
              <circle :cx="20" :cy="getChartY(weeklyQuotations.lastMonth[0])" r="3" fill="#cbd5e1" />
              <circle :cx="106" :cy="getChartY(weeklyQuotations.lastMonth[1])" r="3" fill="#cbd5e1" />
              <circle :cx="192" :cy="getChartY(weeklyQuotations.lastMonth[2])" r="3" fill="#cbd5e1" />
              <circle :cx="280" :cy="getChartY(weeklyQuotations.lastMonth[3])" r="3" fill="#cbd5e1" />

              <!-- 本月 (蓝色实线) -->
              <path :d="thisMonthPath" 
                    fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="line-draw"/>
              <!-- 本月数据点 -->
              <circle :cx="20" :cy="getChartY(weeklyQuotations.thisMonth[0])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
              <circle :cx="106" :cy="getChartY(weeklyQuotations.thisMonth[1])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
              <circle :cx="192" :cy="getChartY(weeklyQuotations.thisMonth[2])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
              <circle :cx="280" :cy="getChartY(weeklyQuotations.thisMonth[3])" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            </svg>
            <!-- X轴标签 -->
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
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-slate-800 flex items-center">
            <i class="ri-bar-chart-line mr-2 text-indigo-500"></i>
            本月型号分布
          </h2>
          <span class="text-xs text-slate-400">Top 5</span>
        </div>
        
        <!-- CSS 柱状图 - 固定5条柱 -->
        <div class="h-48 w-full flex items-end justify-between space-x-6 pt-6 px-2">
          <!-- Bar 1 (Blue) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[0]?.count || '' }}</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div 
                v-if="chartData[0]" 
                class="absolute bottom-0 w-full bg-blue-500 rounded-t-md bar-grow" 
                :style="{ height: getBarHeight(chartData[0].count) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[0]?.modelName">{{ chartData[0]?.modelName || '--' }}</span>
          </div>
          <!-- Bar 2 (Emerald) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[1]?.count || '' }}</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div 
                v-if="chartData[1]" 
                class="absolute bottom-0 w-full bg-emerald-500 rounded-t-md bar-grow" 
                style="animation-delay: 0.1s"
                :style="{ height: getBarHeight(chartData[1].count) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[1]?.modelName">{{ chartData[1]?.modelName || '--' }}</span>
          </div>
          <!-- Bar 3 (Amber) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[2]?.count || '' }}</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div 
                v-if="chartData[2]" 
                class="absolute bottom-0 w-full bg-amber-500 rounded-t-md bar-grow" 
                style="animation-delay: 0.2s"
                :style="{ height: getBarHeight(chartData[2].count) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[2]?.modelName">{{ chartData[2]?.modelName || '--' }}</span>
          </div>
          <!-- Bar 4 (Rose) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[3]?.count || '' }}</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div 
                v-if="chartData[3]" 
                class="absolute bottom-0 w-full bg-rose-500 rounded-t-md bar-grow" 
                style="animation-delay: 0.3s"
                :style="{ height: getBarHeight(chartData[3].count) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[3]?.modelName">{{ chartData[3]?.modelName || '--' }}</span>
          </div>
          <!-- Bar 5 (Purple) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">{{ chartData[4]?.count || '' }}</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div 
                v-if="chartData[4]" 
                class="absolute bottom-0 w-full bg-purple-500 rounded-t-md bar-grow" 
                style="animation-delay: 0.4s"
                :style="{ height: getBarHeight(chartData[4].count) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" :title="chartData[4]?.modelName">{{ chartData[4]?.modelName || '--' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { useReviewStore } from '../store/review'
import { getTimeGreeting } from '../utils/greeting'
import request from '../utils/request'
import QuickNavButton from '../components/dashboard/QuickNavButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const reviewStore = useReviewStore()

// 待审核数量
const pendingCount = ref(0)

// 是否管理员
const isAdmin = computed(() => authStore.user?.role === 'admin')

// 最近操作记录（非管理员显示）
const recentActivities = ref([])

// 问候语
const greeting = computed(() => {
  const userName = authStore.realName || authStore.username || '用户'
  return `${getTimeGreeting()}，${userName}`
})

// 副问候语
const subGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 18 || hour < 6) {
    return '温馨提示：当前为下班时间段，请注意休息~'
  }
  return '欢迎回来，今天又是高效工作的一天~'
})

// 统计数据
const stats = ref({
  monthlyQuotations: 0,
  activeMaterials: 0,
  activeModels: 0,
  growthRate: null,
  materialsLastUpdated: null
})

// 型号排行
const topModels = ref([])

// 周报价数据
const weeklyQuotations = ref({
  thisMonth: [0, 0, 0, 0],
  lastMonth: [0, 0, 0, 0]
})

// 柱状图数据（固定5条，不足的用空填充）
const chartData = computed(() => {
  const data = [...topModels.value]
  // 确保返回最多5条数据
  return data.slice(0, 5)
})

// 计算柱状图高度百分比
const getBarHeight = (count) => {
  if (topModels.value.length === 0) return 0
  const maxCount = Math.max(...topModels.value.map(m => m.count))
  if (maxCount === 0) return 0
  return Math.max(10, Math.round((count / maxCount) * 100))
}

// 法规总览
const regulations = ref([])

// 法规总数（法规类别数量）
const totalRegulations = computed(() => {
  return regulations.value.length
})

// 法规名称列表
const regulationNames = computed(() => {
  return regulations.value.map(r => r.name).slice(0, 3).join('/') || '--'
})

// 原料最近更新时间格式化
const materialsLastUpdatedText = computed(() => {
  if (!stats.value.materialsLastUpdated) return '--'
  const updated = new Date(stats.value.materialsLastUpdated)
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

// 折线图坐标计算
const chartMaxValue = computed(() => {
  const allValues = [...weeklyQuotations.value.thisMonth, ...weeklyQuotations.value.lastMonth]
  return Math.max(...allValues, 1)
})

const getChartY = (value) => {
  // SVG高度120，留10px上边距，所以有效高度110
  if (chartMaxValue.value === 0) return 110
  return 110 - (value / chartMaxValue.value) * 100
}

// 本月折线图路径
const thisMonthPath = computed(() => {
  const data = weeklyQuotations.value.thisMonth
  const points = [
    `20,${getChartY(data[0])}`,
    `106,${getChartY(data[1])}`,
    `192,${getChartY(data[2])}`,
    `280,${getChartY(data[3])}`
  ]
  return `M${points.join(' L')}`
})

// 上月折线图路径
const lastMonthPoints = computed(() => {
  const data = weeklyQuotations.value.lastMonth
  return [
    `20,${getChartY(data[0])}`,
    `106,${getChartY(data[1])}`,
    `192,${getChartY(data[2])}`,
    `280,${getChartY(data[3])}`
  ].join(' ')
})

// Y轴刻度值
const yAxisLabels = computed(() => {
  const max = chartMaxValue.value
  if (max <= 1) return [0, 1]
  // 生成3个刻度：0, 中间值, 最大值
  const mid = Math.round(max / 2)
  return [max, mid, 0]
})

// X轴日期标签（本月每周的日期范围）
const xAxisDateLabels = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  // 每周日期范围：1-7、8-14、15-21、22-月末
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return [
    `${month}/1-7`,
    `${month}/8-14`,
    `${month}/15-21`,
    `${month}/22-${lastDay}`
  ]
})

// 日期相关
const daysCN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const dateDay = computed(() => String(new Date().getDate()).padStart(2, '0'))
const dateMonth = computed(() => String(new Date().getMonth() + 1).padStart(2, '0'))
const currentWeekDayCN = computed(() => daysCN[new Date().getDay()])

// 系统状态
const systemStatus = ref({
  database: 'normal',
  lastBackup: '今日 02:00',
  version: 'Version 1.0'
})

// 快捷导航配置 - 基于用户ID存储
const getStorageKey = () => {
  const userId = authStore.user?.id || 'guest'
  return `dashboard_quick_nav_${userId}`
}

// 所有可选的导航选项
const allNavOptions = [
  { key: 'cost-add', label: '新增报价', icon: 'ri-add-line', iconBgColor: 'bg-blue-100', iconColor: 'text-primary-600', route: '/cost/add', roles: ['admin', 'reviewer', 'salesperson', 'readonly'] },
  { key: 'cost-standard', label: '标准成本', icon: 'ri-file-list-3-line', iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', route: '/cost/standard', roles: ['admin', 'reviewer', 'salesperson', 'readonly'] },
  { key: 'cost-records', label: '成本记录', icon: 'ri-history-line', iconBgColor: 'bg-green-100', iconColor: 'text-green-600', route: '/cost/records', roles: ['admin', 'reviewer', 'salesperson', 'readonly'] },
  { key: 'review-pending', label: '待审核', icon: 'ri-time-line', iconBgColor: 'bg-orange-100', iconColor: 'text-orange-600', route: '/review/pending', roles: ['admin', 'reviewer', 'salesperson'] },
  { key: 'review-approved', label: '已审核', icon: 'ri-checkbox-circle-line', iconBgColor: 'bg-teal-100', iconColor: 'text-teal-600', route: '/review/approved', roles: ['admin', 'reviewer', 'salesperson'] },
  { key: 'materials', label: '原料管理', icon: 'ri-database-2-line', iconBgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', route: '/materials' },
  { key: 'packaging', label: '包材管理', icon: 'ri-box-3-line', iconBgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', route: '/packaging' },
  { key: 'processes', label: '工序管理', icon: 'ri-settings-4-line', iconBgColor: 'bg-rose-100', iconColor: 'text-rose-600', route: '/processes' },
  { key: 'models', label: '型号管理', icon: 'ri-layout-grid-line', iconBgColor: 'bg-pink-100', iconColor: 'text-pink-600', route: '/models' },
  { key: 'regulations', label: '法规管理', icon: 'ri-government-line', iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600', route: '/regulations' },
  { key: 'customers', label: '客户管理', icon: 'ri-user-3-line', iconBgColor: 'bg-lime-100', iconColor: 'text-lime-600', route: '/customers' }
]

// 当前快捷导航列表
const quickNavList = ref([])

// 弹窗显示状态
const showNavSelector = ref(false)

// 可添加的导航选项（排除已添加的，并根据角色过滤）
const availableNavOptions = computed(() => {
  const addedKeys = quickNavList.value.map(n => n.key)
  const userRole = authStore.user?.role
  return allNavOptions.filter(opt => {
    if (addedKeys.includes(opt.key)) return false
    if (opt.roles && !opt.roles.includes(userRole)) return false
    return true
  })
})

// 从 localStorage 加载快捷导航
const loadQuickNav = () => {
  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) {
      const keys = JSON.parse(saved)
      quickNavList.value = keys.map(key => allNavOptions.find(opt => opt.key === key)).filter(Boolean)
    } else {
      // 默认显示两个
      quickNavList.value = [
        allNavOptions.find(opt => opt.key === 'cost-add'),
        allNavOptions.find(opt => opt.key === 'cost-standard')
      ].filter(Boolean)
    }
  } catch {
    quickNavList.value = []
  }
}

// 保存快捷导航到 localStorage
const saveQuickNav = () => {
  const keys = quickNavList.value.map(n => n.key)
  localStorage.setItem(getStorageKey(), JSON.stringify(keys))
}

// 添加快捷导航
const addQuickNav = (option) => {
  if (quickNavList.value.length < 4) {
    quickNavList.value.push(option)
    saveQuickNav()
  }
  showNavSelector.value = false
}

// 删除快捷导航
const removeQuickNav = (index) => {
  quickNavList.value.splice(index, 1)
  saveQuickNav()
}

// 确认删除快捷导航
const confirmRemoveQuickNav = async (index, label) => {
  try {
    await ElMessageBox.confirm(`确定要删除快捷方式「${label}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    removeQuickNav(index)
  } catch {
    // 用户取消
  }
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    // 并行请求所有数据
    const [statsRes, regulationsRes, topModelsRes, weeklyRes] = await Promise.all([
      request.get('/dashboard/stats'),
      request.get('/dashboard/regulations'),
      request.get('/dashboard/top-models'),
      request.get('/dashboard/weekly-quotations')
    ])

    // 统计数据
    if (statsRes.success) {
      stats.value = {
        monthlyQuotations: statsRes.data.monthlyQuotations || 0,
        activeMaterials: statsRes.data.activeMaterials || 0,
        activeModels: statsRes.data.activeModels || 0,
        growthRate: statsRes.data.growthRate,
        materialsLastUpdated: statsRes.data.materialsLastUpdated
      }
    }

    // 法规总览
    if (regulationsRes.success) {
      regulations.value = regulationsRes.data || []
    }

    // 型号排行
    if (topModelsRes.success) {
      topModels.value = topModelsRes.data || []
    }

    // 周报价数据
    if (weeklyRes.success) {
      weeklyQuotations.value = {
        thisMonth: weeklyRes.data.thisMonth || [0, 0, 0, 0],
        lastMonth: weeklyRes.data.lastMonth || [0, 0, 0, 0]
      }
    }

    // 获取待审核数量（producer和purchaser角色不调用）
    const userRole = authStore.user?.role
    const excludedRoles = ['producer', 'purchaser']
    if (!excludedRoles.includes(userRole)) {
      pendingCount.value = await reviewStore.fetchPendingCount()
    }

    // 非管理员加载最近操作记录
    if (userRole !== 'admin') {
      await loadRecentActivities()
    }
  } catch (err) {
    console.error('加载仪表盘数据失败:', err)
  }
}

// 加载最近操作记录
const loadRecentActivities = async () => {
  try {
    const res = await request.get('/dashboard/recent-activities')
    if (res.success) {
      recentActivities.value = res.data || []
    }
  } catch (err) {
    console.error('加载最近操作失败:', err)
  }
}

onMounted(() => {
  loadDashboardData()
  loadQuickNav()
})
</script>

<style scoped>
/* 卡片Hover微动效 */
.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 柱状图增长动画 */
.bar-grow {
  animation: growUp 0.8s ease-out forwards;
  transform-origin: bottom;
  transform: scaleY(0);
}
@keyframes growUp {
  to { transform: scaleY(1); }
}

/* 折线图动画 */
.line-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: dash 1.5s ease-out forwards;
}
@keyframes dash {
  to { stroke-dashoffset: 0; }
}
</style>

<style>
/* 快捷导航弹窗样式 */
.quick-nav-dialog .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}
.quick-nav-dialog .el-dialog__header {
  padding: 20px 24px 12px;
  margin: 0;
}
.quick-nav-dialog .el-dialog__body {
  padding: 0 24px 16px;
}
.quick-nav-dialog .el-dialog__footer {
  padding: 12px 24px 20px;
  border-top: 1px solid #f1f5f9;
}
</style>
