<template>
  <button 
    @click="handleClick"
    :class="[
      'nav-btn group relative',
      isDashed ? 'nav-btn-dashed' : 'nav-btn-solid',
      isShaking ? 'animate-shake' : ''
    ]"
  >
    <!-- 删除按钮 -->
    <span 
      v-if="showDelete && !isDashed"
      @click.stop="handleDelete"
      class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:border-red-200 hover:bg-red-50 cursor-pointer z-10 shadow-sm"
    >
      <i class="ri-close-line text-sm"></i>
    </span>
    
    <div :class="[
      'nav-icon relative',
      isDashed ? 'bg-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200' : iconBgColor
    ]">
      <i :class="[icon, 'text-lg', isDashed ? '' : iconColor]"></i>
      <!-- 气泡徽章 -->
      <span 
        v-if="badge && badge > 0"
        class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-sm"
      >
        {{ badge > 99 ? '99+' : badge }}
      </span>
    </div>
    <span :class="[
      'text-xs font-medium mt-2.5',
      isDashed ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-800'
    ]">
      {{ label }}
    </span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  iconBgColor: {
    type: String,
    default: 'bg-blue-100'
  },
  iconColor: {
    type: String,
    default: 'text-primary-600'
  },
  label: {
    type: String,
    required: true
  },
  isDashed: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  badge: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['click', 'delete'])

const isShaking = ref(false)

const handleClick = () => {
  emit('click')
}

const handleDelete = () => {
  isShaking.value = true
  // 抖动后触发删除确认
  setTimeout(() => {
    emit('delete')
    isShaking.value = false
  }, 300)
}
</script>

<style scoped>
.nav-btn {
  @apply flex flex-col items-center justify-center p-4 rounded-xl;
  transition: all 0.2s ease;
}
.nav-btn-solid {
  @apply bg-white border border-slate-200;
}
.nav-btn-solid:hover {
  @apply border-slate-300 bg-slate-50;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.06);
}
.nav-btn-dashed {
  @apply border border-dashed border-slate-300 bg-slate-50/50;
}
.nav-btn-dashed:hover {
  @apply border-slate-400 bg-slate-100/50;
}
.nav-icon {
  @apply w-11 h-11 rounded-xl flex items-center justify-center;
  transition: transform 0.2s ease;
}
.nav-btn:hover .nav-icon {
  transform: scale(1.05);
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  20% { transform: translateX(-3px) rotate(-2deg); }
  40% { transform: translateX(3px) rotate(2deg); }
  60% { transform: translateX(-3px) rotate(-2deg); }
  80% { transform: translateX(3px) rotate(2deg); }
}
</style>
