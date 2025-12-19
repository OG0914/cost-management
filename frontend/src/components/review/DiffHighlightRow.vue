<template>
  <tr class="diff-row" :class="diffClass" :style="rowStyle">
    <slot></slot>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { getDiffStyle } from '@/utils/review'

const props = defineProps({
  diffStatus: {
    type: String,
    default: 'unchanged',
    validator: (value) => ['unchanged', 'modified', 'added', 'deleted'].includes(value)
  }
})

const diffClass = computed(() => {
  return `diff-${props.diffStatus}`
})

const rowStyle = computed(() => {
  return getDiffStyle(props.diffStatus)
})
</script>

<style scoped>
.diff-row {
  transition: background-color 0.2s ease;
}

/* 一致 - 白色背景 */
.diff-unchanged {
  background-color: #FFFFFF;
}

/* 修改 - 浅蓝背景 */
.diff-modified {
  background-color: #E6F7FF;
  border-left: 3px solid #1890FF;
}

/* 新增 - 浅绿背景 */
.diff-added {
  background-color: #F6FFED;
  border-left: 3px solid #52C41A;
}

/* 删除 - 浅红背景 */
.diff-deleted {
  background-color: #FFF1F0;
  border-left: 3px solid #FF4D4F;
}

.diff-row:hover {
  filter: brightness(0.98);
}
</style>
