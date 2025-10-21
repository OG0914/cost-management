<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>欢迎回来，{{ authStore.realName }}</span>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </template>
      <div class="content">
        <el-descriptions title="用户信息" :column="2" border>
          <el-descriptions-item label="用户名">{{ authStore.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ getRoleName(authStore.userRole) }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ authStore.user?.real_name || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ authStore.user?.email || '未设置' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <el-alert
          title="系统提示"
          type="info"
          description="阶段 3 开发中！基础数据管理模块已就绪。"
          :closable="false"
          show-icon
        />

        <el-divider />

        <div class="quick-links">
          <h3>快速导航</h3>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/regulations')" v-if="authStore.isAdmin">法规管理</el-button>
            <el-button type="primary" @click="$router.push('/models')" v-if="authStore.isAdmin">型号管理</el-button>
            <el-button type="success" @click="$router.push('/materials')">原料管理</el-button>
            <el-button type="warning" @click="$router.push('/processes')">工序管理</el-button>
            <el-button type="info" @click="$router.push('/packaging')">包材管理</el-button>
          </el-space>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 获取角色中文名称
const getRoleName = (role) => {
  const roleMap = {
    admin: '管理员',
    purchaser: '采购人员',
    producer: '生产人员',
    reviewer: '审核人员',
    salesperson: '业务员',
    readonly: '只读用户'
  }
  return roleMap[role] || role
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding: 20px 0;
}
</style>
