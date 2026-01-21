<template>
  <div class="pagination-wrapper">
    <div class="pagination-total">共 {{ total }} 条记录</div>
    <div class="pagination-right">
      <el-pagination
        v-model:current-page="currentPageModel"
        v-model:page-size="pageSizeModel"
        :page-sizes="[8, 10, 50, 100]"
        :total="total"
        layout="prev, pager, next, sizes"
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
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.pagination-total { font-size: 14px; color: #606266; }
.pagination-right { display: flex; align-items: center; }
</style>
