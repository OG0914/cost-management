<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span class="title">成本分析管理系统</span>
        </div>
      </template>
      <div class="content">
        <el-icon :size="80" color="#409EFF">
          <Document />
        </el-icon>
        <h2>欢迎使用成本分析管理系统</h2>
        <p>系统正在开发中...</p>
        <el-button type="primary" @click="checkHealth">检查服务器状态</el-button>
        <div v-if="healthStatus" class="health-status">
          <el-tag :type="healthStatus.success ? 'success' : 'danger'">
            {{ healthStatus.message }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

defineOptions({ name: 'HomePage' })

const healthStatus = ref(null)

const checkHealth = async () => {
  try {
    const response = await request.get('/health')
    healthStatus.value = response
    ElMessage.success('服务器运行正常')
  } catch (error) {
    healthStatus.value = { success: false, message: '服务器连接失败' }
    ElMessage.error('无法连接到服务器')
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  width: 500px;
}

.card-header {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.content h2 {
  margin: 0;
  color: #303133;
}

.content p {
  margin: 0;
  color: #909399;
}

.health-status {
  margin-top: 10px;
}
</style>
