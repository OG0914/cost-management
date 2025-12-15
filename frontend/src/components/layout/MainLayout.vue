<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <!-- 侧边导航栏 -->
    <AppSidebar />
    
    <!-- 主内容区域 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 内容滚动区 -->
      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-7xl mx-auto animate-fade-in">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
</script>

<style scoped>
/* 布局样式已通过 Tailwind 类实现 */
</style>
