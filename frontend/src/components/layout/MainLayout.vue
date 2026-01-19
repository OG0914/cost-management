<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <!-- 移动端顶部栏 -->
    <header class="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
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
    <div class="hidden lg:block">
      <AppSidebar />
    </div>
    
    <!-- 主内容区域 -->
    <main class="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
      <!-- 内容滚动区 -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto animate-fade-in">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const sidebarOpen = ref(false)
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
