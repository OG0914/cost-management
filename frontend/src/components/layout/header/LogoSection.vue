<template>
  <div class="flex items-center mr-6">
    <!-- 展开状态：显示完整Logo和系统名称 -->
    <template v-if="!collapsed">
      <img src="@/images/logo.png" alt="Logo" class="h-[1.35rem] w-auto object-contain mr-[0.5625rem]" />
      <span class="font-bold text-base tracking-tight text-slate-800 hidden sm:block">成本分析系统</span>
    </template>
    <!-- 折叠状态：显示蓝色Logo -->
    <template v-else>
      <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
        <span class="text-white font-bold text-sm">M</span>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})
</script>
