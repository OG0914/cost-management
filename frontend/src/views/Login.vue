<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 标题和图标 -->
      <div class="login-header">
        <el-icon :size="50" color="#409EFF">
          <User />
        </el-icon>
        <h2>用户登录</h2>
      </div>

      <!-- 登录表单 -->
      <div class="login-form">
        <!-- 用户名 -->
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="loginForm.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
          />
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="loginForm.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- 登录按钮 -->
        <button
          class="login-button"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)

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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimHei', sans-serif;
}

.login-card {
  width: 380px;
  height: 380px;
  padding: 32px; /* 登录卡片内边距：32px */
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 26px; /* 登录头部到表单的间距：26px */
}

.login-header :deep(.el-icon) {
  margin-bottom: 13px; /* 图标到标题的间距：13px */
}

.login-header h2 {
  margin: 0;
  font-size: 24px; /* 登录标题：24px */
  font-weight: 600; /* font-weight: 600 */
  color: #2c3e50;
  letter-spacing: 2px;
}

.login-form {
  width: 100%;
}

.form-group {
  margin-bottom: 19px; /* 表单栏位之间的间距：19px */
}

.form-label {
  display: block;
  margin-bottom: 6px; /* 标签到输入框的间距：6px */
  font-size: 11px; /* 表单标签：11px */
  font-weight: 500; /* font-weight: 500 */
  color: #606266;
}

.form-input {
  width: 100%;
  padding: 11px 13px; /* 输入框内边距：11px 13px（上下 11px，左右 13px） */
  font-size: 13px; /* 输入框：13px */
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimHei', sans-serif;
  color: #303133;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #c0c4cc;
}

.form-input:focus {
  border-color: #409EFF;
}

.login-button {
  width: 100%;
  margin-top: 6px; /* 登录按钮顶部间距：6px */
  padding: 9px 13px; /* 登录按钮内边距：9px 13px（上下 9px，左右 13px） */
  font-size: 13px; /* 登录按钮：13px */
  font-weight: 600; /* font-weight: 600 */
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimHei', sans-serif;
  color: #ffffff;
  background-color: #409EFF;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.login-button:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
