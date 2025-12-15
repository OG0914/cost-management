<template>
  <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <!-- 顶部：图标和标签 -->
    <div class="flex justify-between items-start mb-4">
      <div :class="['p-2 rounded-lg', iconBgColor]">
        <i :class="[icon, 'text-xl', iconColor]"></i>
      </div>
      <span 
        v-if="badge" 
        :class="[
          'text-xs font-medium px-2 py-1 rounded-full',
          badgeClass
        ]"
      >
        {{ badge.text }}
      </span>
    </div>
    
    <!-- 标题 -->
    <h3 class="text-slate-500 text-sm font-medium mb-1">{{ title }}</h3>
    
    <!-- 数值 -->
    <p class="text-2xl font-bold text-slate-800">{{ formattedValue }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  iconBgColor: {
    type: String,
    default: 'bg-blue-50'
  },
  iconColor: {
    type: String,
    default: 'text-primary-600'
  },
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  badge: {
    type: Object,
    default: null
    // { text: '+12%', type: 'success' | 'warning' | 'info' }
  }
})

// 格式化数值（添加千分位）
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

// 标签样式
const badgeClass = computed(() => {
  if (!props.badge) return ''
  const typeMap = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-600 bg-orange-50',
    info: 'text-slate-400 bg-slate-50'
  }
  return typeMap[props.badge.type] || typeMap.info
})
</script>
