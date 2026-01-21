<template>
  <div class="cost-page-header">
    <div class="cost-header-left">
      <button
        v-if="showBack"
        class="bg-[#409EFF] w-[40px] h-[40px] rounded-lg flex items-center justify-center cursor-pointer border-none p-0 outline-none transition-opacity duration-200 hover:opacity-80"
        type="button"
        @click="$emit('back')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="20px" width="20px">
          <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#000"></path>
          <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#000"></path>
        </svg>
      </button>
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
