<template>
  <div>
    <!-- 左侧标题栏传送门 -->
    <Teleport v-if="isMounted" to="#header-portal-left">
      <div class="flex items-center">
        <button
          v-if="showBack"
          class="bg-[#409EFF] w-[32px] h-[32px] rounded-lg flex items-center justify-center cursor-pointer border-none p-0 outline-none transition-opacity duration-200 hover:opacity-80 flex-shrink-0 mr-3"
          type="button"
          @click="$emit('back')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="16px" width="16px">
            <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#FFF"></path>
            <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#FFF"></path>
          </svg>
        </button>
        <h2 class="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">{{ title }}</h2>
        <div class="ml-3">
          <slot name="after-title"></slot>
        </div>
      </div>
    </Teleport>

    <!-- 右侧操作栏传送门 -->
    <Teleport v-if="isMounted" to="#header-portal-right">
      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useLayoutStore } from '@/store/layout'

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

const layoutStore = useLayoutStore()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
  layoutStore.setHeaderPortalActive(true)
})

onUnmounted(() => {
  layoutStore.setHeaderPortalActive(false)
})
</script>
