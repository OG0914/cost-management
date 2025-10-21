<template>
  <div class="back-button-wrapper">
    <el-button @click="handleBack" class="back-button">
      <el-icon><ArrowLeft /></el-icon>
      {{ text }}
    </el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  text: {
    type: String,
    default: '返回上一级'
  },
  to: {
    type: String,
    default: '/dashboard'
  }
})

const router = useRouter()

const handleBack = () => {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}
</script>

<style scoped>
.back-button-wrapper {
  margin-bottom: 16px;
}

.back-button {
  font-size: 14px;
}
</style>
