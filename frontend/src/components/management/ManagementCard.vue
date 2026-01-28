<template>
  <div class="management-card group">
    <!-- 顶部颜色条 (方案 B) -->
    <div class="card-accent" :style="{ backgroundColor: getRegulationColor(config.regulation_name) }"></div>
    
    <div class="card-main-content">
      <!-- 头部信息 -->
      <div class="card-header">
        <div class="model-row">
          <span class="model-text" :title="config.model_name">{{ config.model_name }}</span>
          <el-tag size="small" effect="plain" class="factory-badge">{{ getFactoryName(config.factory) }}</el-tag>
        </div>
        <div class="config-title" :title="config.config_name">{{ config.config_name }}</div>
        <div 
          class="regulation-label" 
          :style="{ 
            color: getRegulationColor(config.regulation_name), 
            borderColor: getRegulationColor(config.regulation_name) 
          }"
        >
          {{ config.regulation_name || '通用' }}
        </div>
      </div>

      <!-- 核心参数区域 -->
      <div class="card-params">
        <div class="param-item">
          <el-icon class="param-icon"><Box /></el-icon>
          <span class="param-val">{{ formatPackagingMethodFromConfig(config) }}</span>
        </div>
        <div class="param-item">
          <el-icon class="param-icon"><CopyDocument /></el-icon>
          <span class="param-val">{{ calculateTotalFromConfig(config) }} pcs/箱</span>
        </div>
        <div class="param-item">
          <StatusBadge type="packaging_type" :value="config.packaging_type" />
        </div>
      </div>

      <!-- 底部价格与状态 -->
      <div class="card-footer">
        <div class="price-stack">
          <div class="price-label">{{ type === 'packaging' ? '包材总价' : '工序总价' }}</div>
          <div class="price-amount">
            ¥{{ formatNumber(type === 'packaging' ? config.material_total_price : config.process_total_price) }}
          </div>
          <div class="status-badge-wrapper">
            <StatusBadge type="active_status" :value="config.is_active" mode="text" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 修正后的操作栏 (回归底部固定布局) -->
    <div class="card-actions-v3">
      <el-button :icon="View" circle @click="emit('view', config)" title="查看详情" />
      <el-button v-if="canEdit" :icon="EditPen" circle @click="emit('edit', config)" title="编辑配置" />
      <el-button v-if="canDelete" :icon="Delete" circle class="btn-delete" @click="emit('delete', config)" title="删除配置" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { View, EditPen, Delete, Box, CopyDocument } from '@element-plus/icons-vue' // 图标组件
import { getRegulationColor } from '@/utils/color' // 颜色转换工具
import { formatNumber } from '@/utils/format' // 数字格式化
import { formatPackagingMethodFromConfig, calculateTotalFromConfig } from '@/config/packagingTypes' // 包装计算工具
import StatusBadge from '@/components/common/StatusBadge.vue' // 状态标签组件

interface Props {
  config: any // 配置对象
  type: 'packaging' | 'process' // 业务类型
  canEdit?: boolean // 是否可编辑
  canDelete?: boolean // 是否可删除
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
  canDelete: true
})

const emit = defineEmits<{
  view: [config: any]
  edit: [config: any]
  delete: [config: any]
}>()

// 映射工厂名称
const getFactoryName = (factory: string) => {
  const map: Record<string, string> = {
    'dongguan_xunan': '东莞迅安',
    'hubei_zhiteng': '湖北知腾'
  }
  return map[factory] || factory || '-'
}
</script>

<style scoped>
.management-card {
  position: relative;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.management-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08);
}

.card-accent {
  height: 4px;
  width: 100%;
}

.card-main-content {
  padding: 16px;
  flex: 1;
}

.card-header {
  margin-bottom: 16px;
  position: relative;
}

.model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.model-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.factory-badge {
  font-size: 11px !important;
  color: #64748b !important;
  border-color: #e2e8f0 !important;
  background-color: #f8fafc !important;
}

.config-title {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.regulation-label {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border: 1px solid;
  border-radius: 4px;
  background-color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.card-params {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #f1f5f9;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.param-icon {
  color: #94a3b8;
  font-size: 14px;
}

.card-footer {
  display: flex;
  justify-content: flex-start;
}

.price-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label {
  font-size: 12px;
  color: #94a3b8;
}

.price-amount {
  font-size: 20px;
  font-weight: 800;
  color: #2563eb;
  line-height: 1.2;
}

.status-badge-wrapper {
  margin-top: 6px;
  display: flex;
}

/* 修正的操作栏：固定在底部，取消蒙层 */
.card-actions-v3 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #f1f5f9;
  background-color: #fafbfc;
}

:deep(.el-button.is-circle) {
  width: 36px;
  height: 36px;
  font-size: 16px;
  transition: all 0.2s;
  background-color: #fff;
  border: 1px solid #e2e8f0 !important;
}

:deep(.el-button.is-circle:hover) {
  transform: translateY(-2px);
  border-color: #3b82f6 !important;
  background-color: #eff6ff !important;
  color: #3b82f6 !important;
}

.btn-delete:hover {
  border-color: #fca5a5 !important;
  background-color: #fef2f2 !important;
  color: #ef4444 !important;
}
</style>
