<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
    <!-- 左侧：折叠按钮（预留） -->
    <div class="text-slate-400">
      <i class="ri-menu-fold-line text-xl cursor-pointer hover:text-slate-600 transition-colors"></i>
    </div>
    
    <!-- 右侧：功能图标 -->
    <div class="flex items-center space-x-6">
      <!-- 通知图标 -->
      <div class="relative cursor-pointer group">
        <i class="ri-notification-3-line text-xl text-slate-400 group-hover:text-primary-600 transition-colors"></i>
        <!-- 红点提示 -->
        <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </div>
      
      <!-- 设置图标 -->
      <div class="relative cursor-pointer group">
        <i class="ri-settings-3-line text-xl text-slate-400 group-hover:text-primary-600 transition-colors"></i>
      </div>
    </div>
  </header>
</template>

<script setup>
// 顶部栏组件
// 预留：emit toggle-sidebar 事件用于折叠侧边栏
</script>

<style scoped>
/* 样式已通过 Tailwind 类实现 */
</style>
