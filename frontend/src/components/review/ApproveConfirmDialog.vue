<template>
  <el-dialog
    :model-value="modelValue"
    :title="`✅ 审核通过  ${quotation?.quotation_no || ''}`"
    width="500px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    append-to-body
  >
    <div class="approve-content">
      <el-divider />
      
      <!-- 报价单摘要 -->
      <div class="summary-info">
        <div class="info-line"><span class="label">客户名称:</span><span class="value">{{ quotation?.customer_name }}</span></div>
        <div class="info-line"><span class="label">客户地区:</span><span class="value">{{ quotation?.customer_region || '-' }}</span></div>
        <div class="info-line"><span class="label">销售类型:</span><span class="value">{{ getSalesTypeName(quotation?.sales_type) }}</span></div>
        <div class="info-line"><span class="label">产品型号:</span><span class="value">{{ quotation?.model_name }}</span></div>
        <div class="info-line"><span class="label">订单数量:</span><span class="value">{{ formatQuantity(quotation?.quantity) }}</span></div>
        <div class="info-line"><span class="label">最终价格:</span><span class="value highlight">{{ formatAmount(quotation?.final_price, quotation?.currency) }}</span></div>
      </div>

      <!-- 利润区间 -->
      <div class="profit-section">
        <div class="profit-label">利润区间:</div>
        <div class="profit-list">
          <div v-for="item in profitPricing" :key="item.rate" class="profit-item">
            {{ item.rate }}%: {{ item.price.toFixed(4) }} {{ item.currency }}
          </div>
        </div>
      </div>

      <!-- 审核批注 -->
      <div class="comment-section">
        <div class="comment-label">审核批注 (可选)</div>
        <el-input
          v-model="comment"
          type="textarea"
          :rows="3"
          placeholder="报价合理，同意通过"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="success" @click="handleConfirm" :loading="loading">确认通过</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getSalesTypeName, formatAmount, formatQuantity } from '@/utils/review'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  quotation: {
    type: Object,
    default: null
  },
  profitPricing: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const comment = ref('')
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    comment.value = ''
  }
})

const handleBeforeClose = (done) => {
  emit('update:modelValue', false)
  comment.value = ''
  done()
}

const handleClose = () => {
  emit('update:modelValue', false)
  comment.value = ''
}

const handleConfirm = () => {
  loading.value = true
  emit('confirm', comment.value)
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.approve-content {
  padding: 0 10px;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.info-line {
  display: flex;
  font-size: 14px;
}

.info-line .label {
  width: 80px;
  color: #909399;
}

.info-line .value {
  color: #303133;
}

.info-line .value.highlight {
  color: #67c23a;
  font-weight: 600;
}

.profit-section {
  margin-bottom: 20px;
}

.profit-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.profit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 80px;
}

.profit-item {
  font-size: 14px;
  color: #303133;
}

.comment-section {
  margin-top: 20px;
}

.comment-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
