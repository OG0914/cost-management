<template>
  <div class="config-cards" v-loading="loading">
    <div v-if="paginatedConfigs.length === 0" class="empty-tip">
      暂无匹配数据
    </div>
    <ManagementCard
      v-for="config in paginatedConfigs"
      :key="config.id"
      :config="config"
      type="packaging"
      :can-edit="canEditConfig || canEditMaterial"
      :can-delete="canEditConfig"
      @view="$emit('view', config)"
      @edit="$emit('edit', config)"
      @delete="$emit('delete', config)"
    />
  </div>
</template>

<script setup>
import ManagementCard from '@/components/management/ManagementCard.vue';

defineProps({
  paginatedConfigs: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  canEditConfig: { type: Boolean, default: false },
  canEditMaterial: { type: Boolean, default: false }
});

defineEmits(['view', 'edit', 'delete']);
</script>

<style scoped>
.config-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1199px) {
  .config-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 991px) {
  .config-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .config-cards {
    grid-template-columns: 1fr;
  }
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  padding: 40px 0;
}
</style>
