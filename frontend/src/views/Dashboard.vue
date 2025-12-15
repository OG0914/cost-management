<template>
  <div class="animate-fade-in">
    <!-- 问候语区域 -->
    <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
      <h1 class="text-2xl font-bold text-slate-800 mb-2">
        {{ greeting }}
      </h1>
      <p class="text-slate-500">
        欢迎回来，今天又是高效工作的一天~
      </p>
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
          <span v-if="stats.growthRate" class="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center">
            <i class="ri-arrow-up-line mr-1"></i> {{ stats.growthRate }}%
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

      <!-- 卡片 4: 本月型号 TOP3 -->
      <div class="stat-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-5 flex-1 flex items-center">
          <!-- 左侧：垂直堆叠 -->
          <div class="flex flex-col items-center justify-center pr-4 border-r border-slate-100 min-w-[90px]">
            <div class="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
              <i class="ri-bar-chart-grouped-line text-2xl"></i>
            </div>
            <h3 class="text-slate-600 font-bold text-s text-center leading-tight">本月型号<br>TOP3</h3>
          </div>
          <!-- 右侧：榜单列表 -->
          <div class="flex-1 pl-4 space-y-3">
            <template v-if="topModels.length > 0">
              <div v-for="(item, index) in topModels" :key="index" class="flex items-center justify-between">
                <div class="flex items-center min-w-0">
                  <span :class="[
                    'w-4 h-4 rounded-sm flex-shrink-0 text-[10px] font-bold flex items-center justify-center mr-2',
                    index === 0 ? 'bg-yellow-400 text-white' : 
                    index === 1 ? 'bg-slate-200 text-slate-600' : 
                    'bg-orange-200 text-orange-700'
                  ]">{{ index + 1 }}</span>
                  <span class="text-xs text-slate-700 font-medium truncate">{{ item.modelName }}</span>
                </div>
                <span class="text-xs font-semibold text-slate-400 ml-1">{{ item.count }}</span>
              </div>
            </template>
            <div v-else class="text-xs text-slate-400 text-center py-4">暂无数据</div>
          </div>
        </div>
        <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">统计周期: 自然月</span>
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
</style>
