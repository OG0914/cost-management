<template>
  <div class="review-timeline">
    <div class="timeline-container">
      <div 
        v-for="(item, index) in historyItems" 
        :key="item.id || index"
        class="timeline-item"
        :class="{ 'is-last': index === historyItems.length - 1 }"
      >
        <!-- 时间线节点 -->
        <div class="timeline-node" :class="getNodeClass(item.action)">
          <span class="node-icon">{{ getNodeIcon(item.action) }}</span>
        </div>
        
        <!-- 连接线 -->
        <div class="timeline-line" v-if="index < historyItems.length - 1"></div>
        
        <!-- 内容 -->
        <div class="timeline-content">
          <div class="action-name">{{ getActionName(item.action) }}</div>
          <div class="operator-name">{{ item.operator_name || '-' }}</div>
          <div class="action-time">{{ formatDateTime(item.created_at) }}</div>
          <div class="action-comment" v-if="item.comment">
            {{ item.comment }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime, getReviewActionName } from '@/utils/review'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const historyItems = computed(() => {
  return props.history || []
})

const getActionName = (action) => {
  return getReviewActionName(action)
}

const getNodeClass = (action) => {
  const classMap = {
    created: 'node-created',
    submitted: 'node-submitted',
    approved: 'node-approved',
    rejected: 'node-rejected',
    resubmitted: 'node-resubmitted'
  }
  return classMap[action] || 'node-default'
}

const getNodeIcon = (action) => {
  const iconMap = {
    created: '📝',
    submitted: '📤',
    approved: '✅',
    rejected: '❌',
    resubmitted: '🔄'
  }
  return iconMap[action] || '●'
}
</script>

<style scoped>
.review-timeline {
  width: 100%;
  padding: 8px 0;
}

.timeline-container {
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 8px;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 120px;
  flex: 1;
}

/* 时间线节点 */
.timeline-node {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: 2px solid #dcdfe6;
  z-index: 1;
  font-size: 14px;
}

.node-icon {
  line-height: 1;
}

/* 节点颜色 */
.node-created {
  background: #f5f7fa;
  border-color: #909399;
}

.node-submitted {
  background: #fdf6ec;
  border-color: #e6a23c;
}

.node-approved {
  background: #f0f9eb;
  border-color: #67c23a;
}

.node-rejected {
  background: #fef0f0;
  border-color: #f56c6c;
}

.node-resubmitted {
  background: #ecf5ff;
  border-color: #409eff;
}

/* 连接线 */
.timeline-line {
  position: absolute;
  top: 16px;
  left: calc(50% + 16px);
  width: calc(100% - 32px);
  height: 2px;
  background: linear-gradient(to right, #dcdfe6, #dcdfe6);
}

.timeline-item:not(.is-last) .timeline-line {
  display: block;
}

/* 内容区域 */
.timeline-content {
  margin-top: 12px;
  text-align: center;
  width: 100%;
}

.action-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.operator-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.action-time {
  font-size: 11px;
  color: #909399;
}

.action-comment {
  font-size: 11px;
  color: #606266;
  margin-top: 6px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  max-width: 150px;
  margin-left: auto;
  margin-right: auto;
  word-break: break-all;
}

/* 响应式 */
@media (max-width: 640px) {
  .timeline-item {
    min-width: 100px;
  }
  
  .action-time {
    font-size: 10px;
  }
}
</style>
