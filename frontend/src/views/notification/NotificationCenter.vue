<template>
  <div class="notification-center">
    <el-card class="notification-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2>通知中心</h2>
            <el-tag v-if="unreadCount > 0" type="danger" effect="dark" round>
              {{ unreadCount }} 条未读
            </el-tag>
          </div>
          <div class="header-actions">
            <el-radio-group v-model="filterType" size="small" @change="handleFilterChange">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="unread">未读</el-radio-button>
              <el-radio-button label="material_price_changed">价格变动</el-radio-button>
            </el-radio-group>
            <el-button 
              v-if="unreadCount > 0" 
              type="primary" 
              size="small" 
              @click="handleMarkAllRead"
            >
              <el-icon><Check /></el-icon>
              全部已读
            </el-button>
            <el-button size="small" @click="refreshNotifications">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 通知列表 -->
      <div class="notification-list" v-loading="loading">
        <template v-if="notifications.length > 0">
          <div
            v-for="item in notifications"
            :key="item.id"
            :class="['notification-item', { unread: !item.is_read }]"
          >
            <div class="notification-icon">
              <el-icon v-if="item.type === 'material_price_changed'" class="icon-warning" :size="24">
                <Warning />
              </el-icon>
              <el-icon v-else-if="item.type === 'system'" class="icon-info" :size="24">
                <InfoFilled />
              </el-icon>
              <el-icon v-else class="icon-success" :size="24">
                <CircleCheck />
              </el-icon>
            </div>
            
            <div class="notification-content" @click="handleNotificationClick(item)">
              <div class="notification-header-row">
                <span class="notification-title">{{ item.title }}</span>
                <el-tag v-if="!item.is_read" type="danger" size="small" effect="plain">未读</el-tag>
              </div>
              <div class="notification-text">{{ item.content }}</div>
              <div class="notification-meta">
                <span class="time">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(item.created_at) }}
                </span>
                <el-tag v-if="item.model_name" size="small" type="info">
                  {{ item.model_name }}
                </el-tag>
                <el-tag v-if="item.material_item_no" size="small" type="warning">
                  物料: {{ item.material_item_no }}
                </el-tag>
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

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
        
        <el-empty v-else description="暂无通知" :image-size="120">
          <template #description>
            <p>暂无通知</p>
            <p class="empty-tip">当物料价格变动时，您将收到相关提醒</p>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Warning, 
  InfoFilled, 
  CircleCheck, 
  Close, 
  Check, 
  Refresh, 
  Clock 
} from '@element-plus/icons-vue'
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  dismissNotification 
} from '../../api/notification'
import { formatTime } from '../../utils/format'

const router = useRouter()

// 数据
const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const filterType = ref('all')
const refreshTimer = ref(null)

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      onlyUnread: filterType.value === 'unread',
      type: filterType.value === 'all' || filterType.value === 'unread' ? null : filterType.value
    }
    
    const response = await getNotifications(params)
    if (response.success) {
      notifications.value = response.data.data || []
      total.value = response.data.total || 0
      unreadCount.value = response.data.unreadCount || 0
    }
  } catch (error) {
    console.error('获取通知失败:', error)
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新通知
const refreshNotifications = () => {
  fetchNotifications()
}

// 标记已读
const handleMarkRead = async (id) => {
  try {
    const response = await markAsRead(id)
    if (response.success) {
      const item = notifications.value.find(n => n.id === id)
      if (item) {
        item.is_read = true
      }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      ElMessage.success('已标记为已读')
    }
  } catch (error) {
    ElMessage.error('标记已读失败')
  }
}

// 标记全部已读
const handleMarkAllRead = async () => {
  try {
    ElMessageBox.confirm(
      '确定要将所有通知标记为已读吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      const response = await markAllAsRead()
      if (response.success) {
        notifications.value.forEach(item => item.is_read = true)
        unreadCount.value = 0
        ElMessage.success('已全部标记为已读')
      }
    }).catch(() => {})
  } catch (error) {
    ElMessage.error('标记全部已读失败')
  }
}

// 关闭/忽略通知
const handleDismiss = async (id) => {
  try {
    const response = await dismissNotification(id)
    if (response.success) {
      notifications.value = notifications.value.filter(n => n.id !== id)
      total.value--
      ElMessage.success('通知已关闭')
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
    router.push(`/cost/detail/${item.quotation_id}`)
  } else if (item.standard_cost_id) {
    router.push('/cost/standard')
  } else if (item.model_id) {
    router.push('/models')
  }
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchNotifications()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchNotifications()
}

// 定时刷新
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    fetchNotifications()
  }, 60000) // 每分钟刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(() => {
  fetchNotifications()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.notification-center {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.notification-card {
  min-height: calc(100vh - 140px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-list {
  min-height: 400px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
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
  cursor: pointer;
}

.notification-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.notification-item.unread .notification-title {
  color: #409EFF;
}

.notification-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.notification-meta .time {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.empty-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}
</style>
