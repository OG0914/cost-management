<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- 顶部搜索栏 - 固定 -->
    <header class="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center h-16">
          <!-- 移动端菜单按钮 -->
          <button
            class="lg:hidden mr-4 p-2 rounded-lg hover:bg-slate-100"
            @click="showMobileMenu = true"
          >
            <i class="ri-menu-line text-xl text-slate-600"></i>
          </button>

          <!-- Logo/返回 -->
          <div class="flex items-center flex-shrink-0">
            <i class="ri-book-open-line text-primary-600 text-xl mr-2"></i>
            <span class="font-semibold text-slate-800">帮助中心</span>
          </div>

          <!-- 面包屑 -->
          <div class="hidden md:flex items-center ml-8 text-sm text-slate-500">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <span v-if="index > 0" class="mx-2">/</span>
              <a
                :href="crumb.path"
                class="hover:text-primary-600"
                :class="index === breadcrumbs.length - 1 ? 'text-slate-800 font-medium' : ''"
                @click.prevent="$router.push(crumb.path)"
              >
                {{ crumb.title }}
              </a>
            </template>
          </div>

          <!-- 搜索 - 靠右显示 -->
          <div class="ml-auto w-full max-w-md">
            <HelpSearchBar
              v-model="searchQuery"
              :search-results="searchResults"
              @search="search"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- 下方内容区 - 左右布局 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 桌面端侧边栏 -->
      <HelpSidebar
        :menu="menu"
        :current-path="currentPath"
        class="hidden lg:block w-60 flex-shrink-0 overflow-y-auto scrollbar-hide"
      />

      <!-- 主内容区 -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide" ref="mainContent">
        <HelpContent
          :loading="loading"
          :error="error"
          :rendered-content="renderedContent"
          :navigation="navigation"
          @retry="loadDoc(currentPath)"
        />
      </main>
    </div>

    <!-- 移动端侧边栏抽屉 -->
    <el-drawer
      v-model="showMobileMenu"
      title="帮助目录"
      direction="ltr"
      size="260px"
    >
      <HelpSidebar
        :menu="menu"
        :current-path="currentPath"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHelpDocs } from './composables/useHelpDocs'
import HelpSidebar from './components/HelpSidebar.vue'
import HelpSearchBar from './components/HelpSearchBar.vue'
import HelpContent from './components/HelpContent.vue'

const route = useRoute()
const {
  loading,
  error,
  renderedContent,
  searchQuery,
  searchResults,
  menu,
  currentPath,
  breadcrumbs,
  navigation,
  loadDoc,
  search,
  saveProgress
} = useHelpDocs()

const showMobileMenu = ref(false)
const mainContent = ref(null)

// 监听滚动保存进度
const handleScroll = () => {
  if (mainContent.value) {
    saveProgress(currentPath.value, mainContent.value.scrollTop)
  }
}

onMounted(() => {
  if (mainContent.value) {
    mainContent.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (mainContent.value) {
    mainContent.value.removeEventListener('scroll', handleScroll)
  }
})

// 切换文档时恢复滚动位置
watch(currentPath, (newPath, oldPath) => {
  if (mainContent.value && newPath !== oldPath) {
    // 检查是否是点击导航按钮切换（通过 URL query 参数判断）
    const isNavClick = route.query.nav === 'true'
    if (isNavClick) {
      // 点击导航按钮，强制回到顶部
      mainContent.value.scrollTop = 0
      // 清除标记（替换路由，移除 query 参数）
      window.history.replaceState(null, '', window.location.pathname + window.location.hash.replace('?nav=true', ''))
    } else {
      // 正常切换，尝试恢复位置
      const saved = localStorage.getItem(`help_progress_${newPath}`)
      if (saved) {
        const { scrollTop } = JSON.parse(saved)
        setTimeout(() => {
          if (mainContent.value) {
            mainContent.value.scrollTop = scrollTop
          }
        }, 100)
      } else {
        mainContent.value.scrollTop = 0
      }
    }
  }
})
</script>

<style scoped>
/* 隐藏滚动条但保持滚动功能 */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}
</style>
