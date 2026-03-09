<template>
  <div class="notification-dropdown">
    <el-dropdown trigger="click" @visible-change="handleVisibleChange">
      <div class="notification-trigger">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>
      </div>
      <template #dropdown>
        <div class="notification-panel">
          <div class="notification-header">
            <span class="title">通知提醒</span>
            <div class="actions">
              <el-button v-if="unreadCount > 0" link type="primary" size="small" @click="handleMarkAllRead">
                全部已读
              </el-button>
              <el-button link type="info" size="small" @click="refreshNotifications">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div class="notification-list" v-loading="loading">
            <template v-if="notifications.length > 0">
              <div
                v-for="item in notifications"
                :key="item.id"
                :class="['notification-item', { unread: !item.is_read }]"
                @click="handleNotificationClick(item)"
              >
                <div class="notification-icon">
                  <el-icon v-if="item.type === 'material_price_changed'" class="icon-warning"><Warning /></el-icon>
                  <el-icon v-else-if="item.type === 'system'" class="icon-info"><InfoFilled /></el-icon>
                  <el-icon v-else class="icon-success"><CircleCheck /></el-icon>
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ item.title }}</div>
                  <div class="notification-text">{{ item.content }}</div>
                  <div class="notification-meta">
                    <span class="time">{{ formatTime(item.created_at) }}</span>
                    <el-tag v-if="item.model_name" size="small" type="info">{{ item.model_name }}</el-tag>
                  </div>
                </div>
                <div class="notification-actions">
                  <el-button
                    v-if="!item.is_read"
                    link
                    type="primary"
                    size="small"
                    @click.stop="handleMarkRead(item.id)"
                  >
                    标记已读
                  </el-button>
                  <el-button link type="info" size="small" @click.stop="handleDismiss(item.id)">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无通知" :image-size="60" />
          </div>
          
          <div class="notification-footer">
            <el-button link type="primary" @click="viewAllNotifications">
              查看全部通知
            </el-button>
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Refresh, Warning, InfoFilled, CircleCheck, Close } from '@element-plus/icons-vue'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, dismissNotification } from '../../../api/notification'
import { formatTime } from '../../../utils/format'

const router = useRouter()

const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const refreshTimer = ref(null)

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await getNotifications({ page: 1, pageSize: 10 })
    if (response.success) {
      notifications.value = response.data.data || []
      unreadCount.value = response.data.unreadCount || 0
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const response = await getUnreadCount()
    if (response.success) {
      unreadCount.value = response.data.unreadCount || 0
    }
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

// 刷新通知
const refreshNotifications = () => {
  fetchNotifications()
  fetchUnreadCount()
}

// 标记已读
const handleMarkRead = async (id) => {
  try {
    const response = await markAsRead(id)
    if (response.success) {
      const item = notifications.value.find(n => n.id === id)
      if (item) item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    ElMessage.error('标记已读失败')
  }
}

// 标记全部已读
const handleMarkAllRead = async () => {
  try {
    const response = await markAllAsRead()
    if (response.success) {
      // 立即更新本地数据
      notifications.value.forEach(item => item.is_read = true)
      unreadCount.value = 0
      ElMessage.success('已全部标记为已读')
      // 重新获取通知列表确保数据同步
      await fetchNotifications()
    }
  } catch (error) {
    ElMessage.error('标记全部已读失败')
  }
}

// 关闭通知
const handleDismiss = async (id) => {
  try {
    const response = await dismissNotification(id)
    if (response.success) {
      notifications.value = notifications.value.filter(n => n.id !== id)
      fetchUnreadCount()
    }
  } catch (error) {
    ElMessage.error('关闭通知失败')
  }
}

// 点击通知
const handleNotificationClick = (item) => {
  // 标记已读
  if (!item.is_read) {
    handleMarkRead(item.id)
  }
  
  // 根据通知类型跳转
  if (item.quotation_id) {
    // 跳转到成本记录详情
    router.push(`/cost/detail/${item.quotation_id}`)
  } else if (item.standard_cost_id) {
    // 跳转到标准成本
    router.push('/cost/standard')
  } else if (item.model_id) {
    // 跳转到型号管理
    router.push('/models')
  }
}

// 查看全部通知
const viewAllNotifications = () => {
  router.push('/notifications')
}

// 下拉框显示状态变化
const handleVisibleChange = (visible) => {
  if (visible) {
    fetchNotifications()
  }
}

// 定时刷新
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    fetchUnreadCount()
  }, 60000) // 每分钟刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(() => {
  fetchUnreadCount()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.notification-dropdown {
  display: flex;
  align-items: center;
}

.notification-trigger {
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.notification-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-panel {
  width: 400px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-header .title {
  font-weight: 600;
  font-size: 16px;
}

.notification-header .actions {
  display: flex;
  gap: 8px;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #f0f2f5;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item.unread .notification-title {
  font-weight: 600;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 50%;
}

.notification-icon .icon-warning {
  color: #E6A23C;
}

.notification-icon .icon-info {
  color: #409EFF;
}

.notification-icon .icon-success {
  color: #67C23A;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.notification-meta .time {
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
