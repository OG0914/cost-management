<template>
  <div class="cost-page-header">
    <button class="cost-back-btn" @click="$emit('back')">
      <i class="ri-arrow-left-line"></i>
      <span>返回</span>
    </button>
    <h2 class="cost-page-title">{{ title }}</h2>
    <el-tag :type="isEditMode ? 'warning' : 'info'" size="large">
      状态: {{ isEditMode ? '编辑中' : '创建中' }}
    </el-tag>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '新增报价' },
  isEditMode: { type: Boolean, default: false }
})

defineEmits(['back'])
</script>
