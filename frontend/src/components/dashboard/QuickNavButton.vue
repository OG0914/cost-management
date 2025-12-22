<template>
  <button 
    @click="handleClick"
    :class="[
      'flex flex-col items-center justify-center p-4 rounded-xl transition-all group relative',
      isDashed 
        ? 'border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50' 
        : 'border border-slate-100 hover:border-primary-200 hover:bg-primary-50',
      isShaking ? 'animate-shake' : ''
    ]"
  >
    <!-- 删除按钮 -->
    <span 
      v-if="showDelete && !isDashed"
      @click.stop="handleDelete"
      class="absolute top-1 right-1 w-5 h-5 text-slate-300 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:bg-red-50 cursor-pointer z-10"
    >
      <i class="ri-close-line text-sm"></i>
    </span>
    
    <div :class="[
      'w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative',
      isDashed ? 'bg-slate-100' : iconBgColor
    ]">
      <i :class="[
        icon, 
        'text-xl',
        isDashed ? 'text-slate-400 group-hover:text-slate-600' : iconColor
      ]"></i>
      <!-- 气泡徽章 -->
      <span 
        v-if="badge && badge > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center"
      >
        {{ badge > 99 ? '99+' : badge }}
      </span>
    </div>
    <span :class="[
      'text-sm font-medium',
      isDashed ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-primary-700'
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
