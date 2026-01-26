<template>
  <div class="h-screen overflow-hidden bg-slate-50 flex flex-col">
    <!-- 桌面端顶部固定栏 (仪表盘除外) -->
    <AppHeader 
      class="hidden lg:flex flex-shrink-0"
      :collapsed="isSidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="flex-1 flex overflow-hidden relative">
      <!-- 移动端顶部栏 (保持不变) -->
      <header class="lg:hidden absolute top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div class="flex items-center">
          <button @click="sidebarOpen = true" class="p-2 -ml-2 text-slate-600 hover:text-slate-900">
            <i class="ri-menu-line text-xl"></i>
          </button>
          <span class="ml-2 font-semibold text-slate-800">成本分析系统</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">{{ authStore.realName }}</span>
        </div>
      </header>

      <!-- 移动端侧边栏抽屉 -->
      <el-drawer v-model="sidebarOpen" direction="ltr" :with-header="false" :size="256" class="lg:hidden" :z-index="100">
        <AppSidebar :mobile="true" @close="sidebarOpen = false" />
      </el-drawer>

      <!-- 桌面端侧边导航栏 -->
      <div class="hidden lg:block h-full transition-all duration-300" :class="isSidebarCollapsed ? 'w-16' : 'w-64'">
        <AppSidebar :collapsed="isSidebarCollapsed" @toggle-collapse="toggleSidebar" />
      </div>
      
      <!-- 主内容区域 -->
      <main class="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 h-full">
        <!-- 内容滚动区 -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div class="max-w-7xl mx-auto animate-fade-in pb-10">
            <router-view />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

// 侧边栏折叠状态
const isSidebarCollapsed = ref(false)
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
/* 抽屉样式覆盖 */
:deep(.el-drawer) {
  --el-drawer-padding-primary: 0;
}
:deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}
</style>
