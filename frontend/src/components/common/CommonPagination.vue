<template>
  <div class="pagination-wrapper">
    <div class="pagination-total">
      共 <span class="total-count">{{ total }}</span> 条记录
    </div>
    <div class="pagination-right">
      <el-pagination
        v-model:current-page="currentPageModel"
        v-model:page-size="pageSizeModel"
        :page-sizes="[8, 16, 50, 100]"
        :pager-count="5"
        :total="total"
        background
        layout="sizes, prev, pager, next, jumper"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 8 }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize'])

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (val) => emit('update:currentPage', val)
})

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})
</script>

<style scoped>
/* CSS Variables - 统一主题管理 */
.pagination-wrapper {
  --c-primary: #3b82f6;
  --c-primary-light: #eff6ff;
  --c-text: #64748b;
  --c-text-dark: #0f172a;
  --c-border: #e2e8f0;
  --c-bg-soft: #f8fafc;
  --c-disabled: #cbd5e1;
  --radius: 6px;

  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 24px; 
  padding-top: 20px; 
  border-top: 1px solid #f0f2f5; 
}

.pagination-total { font-size: 14px; color: var(--c-text); font-weight: 500; }
.total-count { color: var(--c-text-dark); font-weight: 600; margin: 0 4px; }

/* Element Plus Pagination 深度定制 */
:deep(.el-pagination) {
  --el-pagination-font-size: 13px;
  --el-pagination-button-width: 32px;
  --el-pagination-button-height: 32px;
  --el-pagination-hover-color: var(--c-primary);
  font-weight: 500;
}

:deep(.el-pagination.is-background .el-pager li),
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  border-radius: var(--radius);
  margin: 0 3px;
  background: #fff;
  border: 1px solid var(--c-border);
  color: var(--c-text);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover),
:deep(.el-pagination.is-background .btn-prev:not(:disabled):hover),
:deep(.el-pagination.is-background .btn-next:not(:disabled):hover) {
  color: var(--c-primary);
  border-color: var(--c-primary);
  background: var(--c-primary-light);
  transform: translateY(-1px);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

:deep(.el-pagination.is-background .btn-prev:disabled),
:deep(.el-pagination.is-background .btn-next:disabled) {
  background: var(--c-bg-soft);
  color: var(--c-disabled);
  border-color: #f1f5f9;
}

/* Select & Jumper 统一样式 */
:deep(.el-select .el-input__wrapper),
:deep(.el-pagination__editor.el-input .el-input__wrapper) {
  box-shadow: none !important;
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}

:deep(.el-select .el-input__wrapper:hover) { border-color: var(--c-disabled); }
:deep(.el-pagination__jump) { margin-left: 12px; color: var(--c-text); }

:deep(.el-pagination__editor.el-input .el-input__wrapper:focus-within) {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 1px var(--c-primary);
}
</style>
