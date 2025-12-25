<template>
  <el-card class="page-header-card">
    <div class="page-header-content">
      <div class="page-header-left">
        <h2>{{ title }}</h2>
        <slot name="subtitle"></slot>
      </div>
      <div class="page-header-right">
        <slot name="actions"></slot>
      </div>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>

<style scoped>
.page-header-card { margin-bottom: 20px; }
.page-header-content { display: flex; justify-content: space-between; align-items: center; }
.page-header-left { display: flex; align-items: center; gap: 15px; }
.page-header-left h2 { margin: 0; font-size: 24px; color: #303133; }
.page-header-right { display: flex; align-items: center; gap: 10px; }
</style>
