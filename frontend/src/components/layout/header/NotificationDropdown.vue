<template>
  <el-dropdown
    trigger="click"
    popper-class="notification-dropdown"
    :teleported="false"
    @visible-change="(visible) => { isOpen = visible; if (visible) fetchNotifications() }"
  >
    <div
      class="relative cursor-pointer p-2.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
      :class="{ 'bg-slate-100': isOpen }"
    >
      <i class="ri-notification-3-line text-xl" :class="isOpen ? 'text-blue-600' : 'text-slate-500'"></i>
      <!-- 未读数量徽章 -->
      <span
        v-if="unreadCount > 0"
        class="absolute top-1.5 right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white shadow-sm"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>

    <template #dropdown>
      <div class="w-[360px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-800">系统通知</span>
            <span v-if="unreadCount > 0" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
              {{ unreadCount }} 条新消息
            </span>
          </div>
          <button
            v-if="unreadCount > 0"
            class="text-xs text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            @click="handleMarkAllRead"
          >
            <i class="ri-brush-line"></i>
            全部已读
          </button>
        </div>

        <!-- 通知列表 -->
        <div class="max-h-[400px] overflow-y-auto notification-list" @scroll="handleScroll">
          <div v-if="loading && currentPage === 1" class="flex items-center justify-center py-8">
            <el-icon class="animate-spin text-slate-400"><i class="ri-loader-4-line text-xl"></i></el-icon>
          </div>

          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
            <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <i class="ri-check-double-line text-2xl text-slate-300"></i>
            </div>
            <p class="text-slate-500 text-sm">暂无新通知</p>
            <p class="text-slate-400 text-xs mt-1">当物料价格变动时，您将收到相关提醒</p>
          </div>

          <template v-else>
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

          <!-- 加载更多 -->
          <div v-if="loadingMore" class="flex items-center justify-center py-4">
            <el-icon class="animate-spin text-slate-400"><i class="ri-loader-4-line"></i></el-icon>
          </div>
        </div>

        <!-- 底部 -->
        <div class="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            class="w-full py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            @click="viewAllNotifications"
          >
            <span>查看全部通知</span>
            <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, InfoFilled, CircleCheck, Close } from '@element-plus/icons-vue'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, dismissNotification } from '../../../api/notification'
import { formatTime } from '../../../utils/format'

const router = useRouter()

// 状态
const isOpen = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const currentPage = ref(1)
const pageSize = 10
const hasMoreNotifications = ref(false)
const refreshTimer = ref(null)

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await getNotifications({ page: 1, pageSize })
    if (response.success) {
      notifications.value = response.data.data || []
      unreadCount.value = response.data.unreadCount || 0
      hasMoreNotifications.value = notifications.value.length >= pageSize
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多
const handleScroll = (e) => {
  const target = e.target
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (scrollBottom < 20 && hasMoreNotifications.value && !loadingMore.value) {
    loadMoreNotifications()
  }
}

const loadMoreNotifications = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  
  try {
    currentPage.value++
    const response = await getNotifications({ page: currentPage.value, pageSize })
    if (response.success && response.data.data) {
      notifications.value.push(...response.data.data)
      hasMoreNotifications.value = response.data.data.length >= pageSize
    }
  } catch (error) {
    console.error('加载更多通知失败:', error)
  } finally {
    loadingMore.value = false
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
      notifications.value.forEach(item => item.is_read = true)
      unreadCount.value = 0
      ElMessage.success('已全部标记为已读')
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
  if (!item.is_read) {
    handleMarkRead(item.id)
  }
  
  if (item.quotation_id) {
    router.push(`/cost/detail/${item.quotation_id}`)
  } else if (item.standard_cost_id) {
    router.push('/cost/standard')
  } else if (item.model_id) {
    router.push('/models')
  }
}

// 查看全部通知
const viewAllNotifications = () => {
  router.push('/notifications')
}

// 定时刷新
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    fetchUnreadCount()
  }, 60000)
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

.icon-warning {
  color: #E6A23C;
}

.icon-info {
  color: #409EFF;
}

.icon-success {
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
</style>
