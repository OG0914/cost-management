<template>
  <article class="max-w-4xl mx-auto">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-20">
      <i class="ri-error-warning-line text-4xl text-slate-300 mb-4"></i>
      <p class="text-slate-500">{{ error }}</p>
      <el-button type="primary" class="mt-4" @click="$emit('retry')">
        重试
      </el-button>
    </div>

    <!-- 内容 -->
    <div v-else>
      <div class="help-markdown-content" v-html="renderedContent"></div>

      <!-- 上一篇/下一篇导航 -->
      <div v-if="navigation.prev || navigation.next" class="mt-12 pt-8 border-t border-slate-200">
        <div class="flex justify-between">
          <div v-if="navigation.prev" class="flex-1">
            <div class="text-xs text-slate-400 mb-1">上一篇</div>
            <a
              :href="navigation.prev.path"
              class="text-primary-600 hover:text-primary-700 flex items-center"
              @click.prevent="navigateToDoc(navigation.prev.path)"
            >
              <i class="ri-arrow-left-line mr-1"></i>
              {{ navigation.prev.title }}
            </a>
          </div>
          <div v-if="navigation.next" class="flex-1 text-right">
            <div class="text-xs text-slate-400 mb-1">下一篇</div>
            <a
              :href="navigation.next.path"
              class="text-primary-600 hover:text-primary-700 flex items-center justify-end"
              @click.prevent="navigateToDoc(navigation.next.path)"
            >
              {{ navigation.next.title }}
              <i class="ri-arrow-right-line ml-1"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  renderedContent: { type: String, required: true },
  navigation: {
    type: Object,
    default: () => ({ prev: null, next: null })
  }
})

const emit = defineEmits(['retry'])
const router = useRouter()

// 导航到文档并强制回到顶部
const navigateToDoc = (path) => {
  // 添加标记，告诉 HelpView 这是导航点击，不要恢复滚动位置
  router.push({ path, query: { nav: 'true' } })
}
</script>

<style>
.help-markdown-content h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #1e293b;
}
.help-markdown-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1e293b;
}
.help-markdown-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}
.help-markdown-content p {
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: #475569;
  line-height: 1.625;
}
.help-markdown-content ul {
  list-style-type: disc;
  list-style-position: inside;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
  color: #475569;
}
.help-markdown-content ol {
  list-style-type: decimal;
  list-style-position: inside;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
  color: #475569;
}
.help-markdown-content li {
  color: #475569;
}
.help-markdown-content a {
  color: #2563eb;
  text-decoration: none;
}
.help-markdown-content a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}
.help-markdown-content table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e2e8f0;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.help-markdown-content th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #334155;
  padding: 0.75rem;
  text-align: left;
  border: 1px solid #e2e8f0;
}
.help-markdown-content td {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  color: #475569;
}
.help-markdown-content tr {
  border-bottom: 1px solid #e2e8f0;
}
.help-markdown-content code {
  background-color: #f1f5f9;
  color: #1e293b;
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.help-markdown-content pre {
  background-color: #1e293b;
  color: #f1f5f9;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.help-markdown-content pre code {
  background-color: transparent;
  color: #f1f5f9;
  padding: 0;
}
.help-markdown-content blockquote {
  border-left: 4px solid #60a5fa;
  background-color: rgba(239, 246, 255, 0.5);
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-style: italic;
  color: #475569;
}
</style>
