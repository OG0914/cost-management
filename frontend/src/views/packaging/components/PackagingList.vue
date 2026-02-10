<template>
  <el-table
    :data="paginatedConfigs"
    border
    stripe
    v-loading="loading"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column prop="model_category" label="产品类别" width="110" sortable />
    <el-table-column prop="model_name" label="型号" width="120" sortable />
    <el-table-column prop="config_name" label="配置名称" width="150" sortable />
    <el-table-column label="生产工厂" width="120" sortable sort-by="factory">
      <template #default="{ row }">
        {{ getFactoryName(row.factory) }}
      </template>
    </el-table-column>
    <!-- 包装类型列（只读） -->
    <el-table-column label="包装类型" width="120" sortable sort-by="packaging_type">
      <template #default="{ row }">
        <StatusBadge type="packaging_type" :value="row.packaging_type" />
      </template>
    </el-table-column>
    <el-table-column label="包装方式" min-width="280" sortable>
      <template #default="{ row }">
        <span class="packaging-info">
          {{ formatPackagingMethodFromConfig(row) }}
        </span>
      </template>
    </el-table-column>
    <el-table-column label="每箱数量(pcs)" width="120" align="right">
      <template #default="{ row }">
        {{ calculateTotalFromConfig(row) }}
      </template>
    </el-table-column>
    <el-table-column label="包材总价" width="130" align="right" sortable sort-by="material_total_price">
      <template #default="{ row }">
        <span class="price-info">¥{{ formatNumber(row.material_total_price || 0) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="状态" width="100" align="center" sortable sort-by="is_active">
      <template #default="{ row }">
        <StatusBadge type="active_status" :value="row.is_active" mode="text" />
      </template>
    </el-table-column>
    <el-table-column label="创建时间" width="180" sortable>
      <template #default="{ row }">
        {{ formatDateTime(row.created_at) }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="140" fixed="right">
      <template #default="{ row }">
        <el-button :icon="View" circle size="small" @click="$emit('view', row)" title="查看" />
        <el-button :icon="EditPen" circle size="small" @click="$emit('edit', row)" v-if="canEditConfig || canEditMaterial" title="编辑" />
        <el-button :icon="Delete" circle size="small" class="delete-btn" @click="$emit('delete', row)" v-if="canEditConfig" title="删除" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { View, EditPen, Delete } from '@element-plus/icons-vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { formatNumber, formatDateTime } from '@/utils/format';
import { formatPackagingMethodFromConfig, calculateTotalFromConfig } from '@/config/packagingTypes';

defineProps({
  paginatedConfigs: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  canEditConfig: { type: Boolean, default: false },
  canEditMaterial: { type: Boolean, default: false }
});

const emit = defineEmits(['view', 'edit', 'delete', 'selection-change']);

const getFactoryName = (factory) => {
  const map = {
    'dongguan_xunan': '东莞迅安',
    'hubei_zhiteng': '湖北知腾'
  };
  return map[factory] || factory || '-';
};

const handleSelectionChange = (selection) => {
  emit('selection-change', selection);
};
</script>

<style scoped>
.packaging-info { color: #606266; font-weight: 500; }
.price-info { color: #409EFF; font-weight: 600; font-size: 14px; }
</style>
