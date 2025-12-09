<template>
  <div class="h-screen w-full flex overflow-hidden bg-white">
    <!-- 左侧：品牌展示区 (移动端隐藏) -->
    <div class="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-blue-600">
      <!-- 装饰性背景圆圈 (增加层次感) -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div class="z-10 text-white p-12 max-w-lg">
        <!-- 公司Logo -->
        <div class="mb-6">
          <img :src="logoImage" alt="Company Logo" class="h-auto opacity-90" style="width: 380px;">
        </div>
        <h1 class="text-4xl font-bold mb-4" style="letter-spacing: 2rem;">成本分析系统</h1>
        <p class="text-blue-100 text-lg font-light leading-relaxed">
          
        </p>
        <div class="mt-8 border-t border-blue-400/30 pt-8">
          <p class="text-sm text-blue-200">内部专用 · 数据保密 · 高效决策</p>
        </div>
      </div>
    </div>

    <!-- 右侧：登录表单区 -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12">
      <div class="w-full max-w-md space-y-8">
        
        <!-- 顶部标题 -->
        <div class="text-center lg:text-left">
          <!-- 移动端显示的Logo (仅在小屏幕显示) -->
          <div class="lg:hidden flex justify-center mb-4">
            <el-icon :size="40" color="#2563eb">
              <TrendCharts />
            </el-icon>
          </div>
          <h2 class="text-4xl font-bold text-gray-900 tracking-tight">欢迎回来~</h2>
          <p class="mt-2 text-sm text-gray-500">请输入您的账号信息登录</p>
        </div>

        <!-- 表单区域 -->
        <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-5">
            <!-- 账号输入 -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <div class="relative">
                <input 
                  id="username" 
                  v-model="loginForm.username"
                  type="text" 
                  autocomplete="username" 
                  required 
                  class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 sm:text-sm" 
                  placeholder=""
                >
              </div>
            </div>

            <!-- 密码输入 -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
              </div>
              <div class="relative">
                <input 
                  id="password" 
                  v-model="loginForm.password"
                  type="password" 
                  autocomplete="current-password" 
                  required 
                  class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 sm:text-sm" 
                  placeholder=""
                  @keyup.enter="handleLogin"
                >
              </div>
            </div>
          </div>


          <!-- 登录按钮 -->
          <div>
            <button 
              type="submit" 
              :disabled="loading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <!-- 锁图标 -->
                <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition ease-in-out duration-150" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </span>
              {{ loading ? '登录中...' : '立即登录' }}
            </button>
          </div>
        </form>

        <!-- 底部版权 -->
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-400">
            &copy; 2025 Makrite Inc. All rights reserved. <br>
            若有疑问，请及时联系工程部。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import logoImage from '../images/logo.png'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const rememberMe = ref(false)

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 处理登录
const handleLogin = async () => {
  // 简单验证
  if (!loginForm.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!loginForm.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (loginForm.password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  loading.value = true
  try {
    await authStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 自定义渐变背景，模拟数据流动的科技感 */
.brand-bg {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
}

/* 确保使用Inter字体或系统默认字体 */
* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
}
</style>
