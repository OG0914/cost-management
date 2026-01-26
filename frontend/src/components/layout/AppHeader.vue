<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
    <!-- 左侧：Logo + 折叠按钮 -->
    <div class="flex items-center">
      <!-- Logo区域 -->
      <div class="flex items-center mr-6">
        <img src="../../images/logo.png" alt="Logo" class="h-[1.35rem] w-auto object-contain mr-[0.5625rem]" />
        <span class="font-bold text-base tracking-tight text-slate-800 hidden sm:block">成本分析系统</span>
      </div>

      <!-- 折叠按钮 -->
      <div 
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-lg cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors mr-4"
      >
        <i :class="collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'" class="text-xl"></i>
      </div>

      <!-- 分割线 (仅在有门户内容时显示) -->
      <div v-if="layoutStore.isHeaderPortalActive" class="h-6 w-px bg-slate-300 mx-4"></div>

      <!-- 门户插槽（左侧标题） -->
      <div id="header-portal-left" class="flex items-center"></div>
    </div>
    
    <!-- 右侧：功能图标 -->
    <div class="flex items-center">
      <!-- 门户插槽（右侧操作栏） -->
      <div id="header-portal-right" class="flex items-center"></div>

      <!-- 分割线 (仅在有门户内容时显示) -->
      <div v-if="layoutStore.isHeaderPortalActive" class="h-6 w-px bg-slate-300 mx-4"></div>

      <div class="flex items-center space-x-5 mr-4">
        <!-- 通知图标 -->
        <div class="relative cursor-pointer group p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
          <i class="ri-notification-3-line text-xl text-slate-400 group-hover:text-primary-600 transition-colors"></i>
          <!-- 红点提示 -->
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
      
      <!-- 设置图标 -->
      <div class="relative cursor-pointer group p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
        <i class="ri-settings-3-line text-xl text-slate-400 group-hover:text-primary-600 transition-colors"></i>
      </div>
    </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-sidebar'])

import { useLayoutStore } from '@/store/layout'
const layoutStore = useLayoutStore()
</script>

<style scoped>
/* 样式已通过 Tailwind 类实现 */
</style>
