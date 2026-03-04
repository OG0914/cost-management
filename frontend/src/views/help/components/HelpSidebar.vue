<template>
  <aside class="w-60 flex-shrink-0 border-r border-slate-200 bg-white h-full">
    <nav class="p-4">
      <div v-for="item in menu" :key="item.path" class="mb-2">
        <!-- 一级菜单 -->
        <div
          class="flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-primary-50 text-primary-600'
              : 'text-slate-600 hover:bg-slate-50'
          ]"
          @click="handleItemClick(item)"
        >
          <i :class="[item.icon, 'mr-2']"></i>
          <span class="text-sm font-medium flex-1">{{ item.title }}</span>
          <i
            v-if="item.children?.length"
            :class="[
              'ri-arrow-down-s-line transition-transform',
              isExpanded(item.path) ? 'rotate-180' : ''
            ]"
          ></i>
        </div>

        <!-- 二级菜单 -->
        <div v-if="item.children?.length && isExpanded(item.path)" class="ml-4 mt-1">
          <div
            v-for="child in item.children"
            :key="child.path"
            class="px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors"
            :class="[
              currentPath === child.path
                ? 'bg-primary-50 text-primary-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            ]"
            @click="$router.push(child.path)"
          >
            {{ child.title }}
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  menu: { type: Array, required: true },
  currentPath: { type: String, default: '/' }
})

const router = useRouter()
const expandedKeys = ref(new Set())

// 初始化展开当前项
watch(() => props.currentPath, (path) => {
  for (const item of props.menu) {
    if (item.children?.some(c => c.path === path)) {
      expandedKeys.value.add(item.path)
    }
  }
}, { immediate: true })

const isActive = (path) => {
  return props.currentPath === path ||
    props.menu.find(m => m.path === path)?.children?.some(c => c.path === props.currentPath)
}

const isExpanded = (path) => {
  return expandedKeys.value.has(path)
}

const handleItemClick = (item) => {
  if (item.children?.length) {
    if (expandedKeys.value.has(item.path)) {
      expandedKeys.value.delete(item.path)
    } else {
      expandedKeys.value.add(item.path)
    }
  }
  router.push(item.path)
}
</script>
