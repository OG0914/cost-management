<template>
  <div class="cost-page-header">
    <div class="cost-header-left">
      <button v-if="showBack" class="cost-back-btn" type="button" @click="$emit('back')">返回</button>
      <h2 class="cost-page-title">{{ title }}</h2>
      <slot name="after-title"></slot>
    </div>
    <div class="cost-header-right">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: false
  }
})

defineEmits(['back'])
</script>

<style scoped>
/*样式已在 cost-form.css 中全局定义，此处无需重复 */
</style>
