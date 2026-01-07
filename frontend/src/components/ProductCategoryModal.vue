<template>
  <el-dialog
    v-model="visible"
    title="选择产品类别"
    width="400px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <div v-if="loading" class="category-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="categories.length === 0" class="category-empty">
      <el-icon class="empty-icon"><Warning /></el-icon>
      <p class="empty-title">暂无产品类别</p>
      <p class="empty-desc">请先在「型号管理」中添加型号并设置产品类别</p>
      <el-button type="primary" size="small" @click="goToModelManage">前往型号管理</el-button>
    </div>
    <div v-else class="category-list">
      <div
        v-for="category in categories"
        :key="category"
        class="category-item"
        :class="{ 'is-selected': selectedCategory === category }"
        @click="selectCategory(category)"
      >
        <el-icon class="category-icon">
          <component :is="getCategoryIcon(category)" />
        </el-icon>
        <span class="category-name">{{ category }}</span>
        <el-icon v-if="selectedCategory === category" class="check-icon">
          <Check />
        </el-icon>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedCategory">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Goods, FirstAidKit, Loading, Warning } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import logger from '@/utils/logger'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  defaultCategory: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const router = useRouter()
const visible = ref(false)
const categories = ref([])
const selectedCategory = ref('')
const loading = ref(false)

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    loadCategories()
    selectedCategory.value = props.defaultCategory || ''
  }
})

// 监听 visible 变化
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 加载产品类别列表
const loadCategories = async () => {
  loading.value = true
  try {
    const res = await request.get('/models/categories')
    if (res.success) {
      categories.value = res.data || []
    }
  } catch (error) {
    logger.error('加载产品类别失败:', error)
    ElMessage.error('加载产品类别失败')
  } finally {
    loading.value = false
  }
}

// 选择类别
const selectCategory = (category) => {
  selectedCategory.value = category
}

// 获取类别图标
const getCategoryIcon = (category) => {
  if (category.includes('口罩')) {
    return 'FirstAidKit'
  }
  return 'Goods'
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
  selectedCategory.value = ''
}

// 确认选择
const handleConfirm = () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请选择产品类别')
    return
  }
  emit('confirm', selectedCategory.value)
  handleClose()
}

// 前往型号管理
const goToModelManage = () => {
  handleClose()
  router.push('/models')
}

onMounted(() => {
  if (props.modelValue) {
    loadCategories()
  }
})
</script>

<style scoped>
.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.category-item.is-selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.category-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.category-name {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.check-icon {
  font-size: 20px;
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 加载状态 */
.category-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
  gap: 12px;
}

/* 空状态 */
.category-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px 0;
}
</style>
