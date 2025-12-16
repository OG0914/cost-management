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
          欢迎回来，今天又是高效工作的一天~
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
          <span class="text-xs text-slate-400">1小时前</span>
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
            <span class="text-3xl font-bold text-slate-800">{{ stats.activeModels || 45 }}</span>
            <span class="text-sm font-medium text-slate-400">款</span>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">包含折叠/杯型/平面</span>
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
            icon="ri-add-line"
            icon-bg-color="bg-blue-100"
            icon-color="text-primary-600"
            label="新增报价"
            @click="$router.push('/cost/add')"
          />
          <QuickNavButton
            icon="ri-file-list-3-line"
            icon-bg-color="bg-purple-100"
            icon-color="text-purple-600"
            label="标准成本"
            @click="$router.push('/cost/standard')"
          />
          <QuickNavButton
            icon="ri-add-line"
            :is-dashed="true"
            label="自定义"
          />
        </div>
      </div>

      <!-- 系统概况 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
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
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <!-- 左侧图表：报价单对比 (双折线图) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-slate-800 flex items-center">
            <i class="ri-line-chart-line mr-2 text-blue-500"></i>
            报价单对比 (环比)
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
        <div class="h-48 w-full relative">
          <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
            <!-- 网格线 -->
            <line x1="0" y1="0" x2="300" y2="0" stroke="#f1f5f9" stroke-width="1" />
            <line x1="0" y1="40" x2="300" y2="40" stroke="#f1f5f9" stroke-width="1" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" stroke-width="1" />
            <line x1="0" y1="120" x2="300" y2="120" stroke="#e2e8f0" stroke-width="1" />
            
            <!-- 上月 (灰色虚线) -->
            <polyline points="20,80 106,65 192,75 280,50" 
                      fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
            <circle cx="20" cy="80" r="3" fill="#cbd5e1" />
            <circle cx="106" cy="65" r="3" fill="#cbd5e1" />
            <circle cx="192" cy="75" r="3" fill="#cbd5e1" />
            <circle cx="280" cy="50" r="3" fill="#cbd5e1" />

            <!-- 本月 (蓝色实线) -->
            <path d="M20,100 L106,50 L192,40 L280,10" 
                  fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="line-draw"/>
            <!-- 本月数据点 -->
            <circle cx="20" cy="100" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle cx="106" cy="50" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle cx="192" cy="40" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
            <circle cx="280" cy="10" r="4" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
          </svg>
          <!-- X轴标签 -->
          <div class="flex justify-between text-xs text-slate-400 mt-2 px-4">
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
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
        
        <!-- CSS 柱状图 -->
        <div class="h-48 w-full flex items-end justify-between space-x-6 pt-6 px-2">
          <!-- Bar 1 (Blue) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">158</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div class="absolute bottom-0 w-full bg-blue-500 rounded-t-md bar-grow" style="height: 85%"></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium">KN95</span>
          </div>
          <!-- Bar 2 (Emerald) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">120</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div class="absolute bottom-0 w-full bg-emerald-500 rounded-t-md bar-grow" style="height: 65%; animation-delay: 0.1s"></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium">N95</span>
          </div>
          <!-- Bar 3 (Amber) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">96</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div class="absolute bottom-0 w-full bg-amber-500 rounded-t-md bar-grow" style="height: 50%; animation-delay: 0.2s"></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium">FFP2</span>
          </div>
          <!-- Bar 4 (Rose) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">64</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div class="absolute bottom-0 w-full bg-rose-500 rounded-t-md bar-grow" style="height: 35%; animation-delay: 0.3s"></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium">FFP3</span>
          </div>
          <!-- Bar 5 (Purple) -->
          <div class="flex flex-col items-center flex-1 group relative">
            <span class="text-xs font-bold text-slate-600 mb-1 transition-transform group-hover:-translate-y-1">42</span>
            <div class="w-full bg-slate-50 rounded-t-md relative h-32 overflow-hidden">
              <div class="absolute bottom-0 w-full bg-purple-500 rounded-t-md bar-grow" style="height: 25%; animation-delay: 0.4s"></div>
            </div>
            <span class="text-xs text-slate-500 mt-2 font-medium">Flat</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { getTimeGreeting } from '../utils/greeting'
import request from '../utils/request'
import QuickNavButton from '../components/dashboard/QuickNavButton.vue'

const authStore = useAuthStore()

// 问候语
const greeting = computed(() => {
  const userName = authStore.realName || authStore.username || '用户'
  return `${getTimeGreeting()}，${userName}`
})

// 统计数据
const stats = ref({
  monthlyQuotations: 0,
  activeMaterials: 0,
  growthRate: null
})

// 型号排行
const topModels = ref([])

// 法规总览
const regulations = ref([])

// 法规总数
const totalRegulations = computed(() => {
  return regulations.value.reduce((sum, reg) => sum + reg.count, 0)
})

// 法规名称列表
const regulationNames = computed(() => {
  return regulations.value.map(r => r.name).slice(0, 3).join('/') || '--'
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

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    // 并行请求所有数据
    const [statsRes, regulationsRes, topModelsRes] = await Promise.all([
      request.get('/dashboard/stats'),
      request.get('/dashboard/regulations'),
      request.get('/dashboard/top-models')
    ])

    // 统计数据
    if (statsRes.success) {
      stats.value = {
        monthlyQuotations: statsRes.data.monthlyQuotations || 0,
        activeMaterials: statsRes.data.activeMaterials || 0,
        growthRate: statsRes.data.growthRate
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
  } catch (err) {
    console.error('加载仪表盘数据失败:', err)
  }
}

onMounted(() => {
  loadDashboardData()
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
