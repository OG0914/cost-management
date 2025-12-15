<template>
  <button 
    @click="$emit('click')"
    :class="[
      'flex flex-col items-center justify-center p-4 rounded-xl transition-all group',
      isDashed 
        ? 'border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50' 
        : 'border border-slate-100 hover:border-primary-200 hover:bg-primary-50'
    ]"
  >
    <div :class="[
      'w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform',
      isDashed ? 'bg-slate-100' : iconBgColor
    ]">
      <i :class="[
        icon, 
        'text-xl',
        isDashed ? 'text-slate-400 group-hover:text-slate-600' : iconColor
      ]"></i>
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
defineProps({
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
  }
})

defineEmits(['click'])
</script>
