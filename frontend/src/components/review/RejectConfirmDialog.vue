<template>
  <el-dialog
    :model-value="modelValue"
    :title="`⚠️ 退回报价单  ${quotation?.quotation_no || ''}`"
    width="500px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    append-to-body
  >
    <div class="reject-content">
      <el-divider />
      
      <!-- 报价单摘要 -->
      <div class="summary-info">
        <div class="info-line"><span class="label">客户名称:</span><span class="value">{{ quotation?.customer_name }}</span></div>
        <div class="info-line"><span class="label">客户地区:</span><span class="value">{{ quotation?.customer_region || '-' }}</span></div>
        <div class="info-line"><span class="label">销售类型:</span><span class="value">{{ getSalesTypeName(quotation?.sales_type) }}</span></div>
        <div class="info-line"><span class="label">产品型号:</span><span class="value">{{ quotation?.model_name }}</span></div>
        <div class="info-line"><span class="label">订单数量:</span><span class="value">{{ formatQuantity(quotation?.quantity) }}</span></div>
        <div class="info-line"><span class="label">最终价格:</span><span class="value">{{ formatAmount(quotation?.final_price, quotation?.currency) }}</span></div>
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

      <!-- 退回原因 -->
      <div class="reason-section">
        <div class="reason-label">退回原因 <span class="required">*</span></div>
        <el-input
          v-model="reason"
          type="textarea"
          :rows="3"
          placeholder="无纺布单价与市场价差异较大，请重新核实供应商报价"
        />
        <div v-if="showError" class="error-text">请输入退回原因</div>
      </div>

      <!-- 提示 -->
      <div class="hint-text">
        💡 提示：退回后业务员可修改报价单并重新提交
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="danger" @click="handleConfirm" :loading="loading">确认退回</el-button>
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

const reason = ref('')
const loading = ref(false)
const showError = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    reason.value = ''
    showError.value = false
  }
})

const handleBeforeClose = (done) => {
  emit('update:modelValue', false)
  reason.value = ''
  showError.value = false
  done()
}

const handleClose = () => {
  emit('update:modelValue', false)
  reason.value = ''
  showError.value = false
}

const handleConfirm = () => {
  if (!reason.value.trim()) {
    showError.value = true
    return
  }
  loading.value = true
  emit('confirm', reason.value)
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.reject-content {
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

.reason-section {
  margin-top: 20px;
}

.reason-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.required {
  color: #f56c6c;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.hint-text {
  margin-top: 16px;
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
