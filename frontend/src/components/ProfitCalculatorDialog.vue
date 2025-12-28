<template>
  <el-dialog
    :model-value="modelValue"
    title="💰 利润计算器"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    destroy-on-close
    append-to-body
  >
    <div class="calculator-content">
      <!-- 成本价输入 -->
      <div class="input-section">
        <div class="input-label">最终成本价 ({{ currency }})</div>
        <el-input v-model.number="costPrice" placeholder="请输入成本价" style="width: 100%" />
      </div>

      <!-- 利润率选择 -->
      <div class="input-section">
        <div class="input-label">利润率</div>
        <div class="profit-rate-options">
          <el-radio-group v-model="selectedRate" @change="onRateChange">
            <el-radio-button 
              v-for="rate in profitTiers" 
              :key="rate" 
              :value="rate"
            >
              {{ (rate * 100).toFixed(0) }}%
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="custom-rate">
          <el-checkbox v-model="useCustomRate" @change="onCustomRateToggle">自定义</el-checkbox>
          <el-input
            v-if="useCustomRate"
            v-model.number="customRate"
            placeholder="输入"
            style="width: 100px; margin-left: 12px"
          />
          <span v-if="useCustomRate" class="unit">%</span>
        </div>
      </div>

      <!-- 数量输入 -->
      <div class="input-section">
        <div class="input-label">订单数量 (PCS)</div>
        <el-input v-model.number="quantity" placeholder="请输入数量" style="width: 100%" />
      </div>

      <!-- 计算结果 -->
      <div class="result-section" v-if="parseFloat(costPrice) > 0 && parseInt(quantity) > 0">
        <div class="result-title">📊 计算结果</div>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">单片卖价</span>
            <span class="value">{{ formatNumber(result.unitPrice) }} {{ currency }}</span>
          </div>
          <div class="result-item">
            <span class="label">单片利润</span>
            <span class="value">{{ formatNumber(result.unitProfit) }} {{ currency }}</span>
          </div>
          <div class="result-item highlight">
            <span class="label">总利润</span>
            <span class="value">{{ formatNumber(result.totalProfit) }} {{ currency }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useConfigStore } from '@/store/config'
import { formatNumber } from '@/utils/format'

defineOptions({ name: 'ProfitCalculatorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialCostPrice: { type: Number, default: 0 },
  initialQuantity: { type: Number, default: 0 },
  currency: { type: String, default: 'CNY' } // 币别
})

defineEmits(['update:modelValue'])

const configStore = useConfigStore()

// 表单数据
const costPrice = ref(0)
const quantity = ref(10000)
const selectedRate = ref(0.25)
const useCustomRate = ref(false)
const customRate = ref(15)

// 利润区间选项
const profitTiers = computed(() => configStore.config.profit_tiers || [0.05, 0.10, 0.25, 0.50])

// 当前生效的利润率
const effectiveRate = computed(() => {
  if (useCustomRate.value) return (parseFloat(customRate.value) || 0) / 100
  return selectedRate.value
})

// 计算结果
const result = computed(() => {
  const cost = parseFloat(costPrice.value) || 0
  const rate = effectiveRate.value
  const qty = parseInt(quantity.value) || 0
  if (cost <= 0 || rate < 0 || qty <= 0) {
    return { unitPrice: 0, unitProfit: 0, totalProfit: 0 }
  }
  const unitPrice = cost / (1 - rate) // 毛利率公式
  const unitProfit = unitPrice - cost
  const totalProfit = unitProfit * qty
  return { unitPrice, unitProfit, totalProfit }
})

// 利润率选择变化
const onRateChange = () => {
  useCustomRate.value = false
}

// 自定义利润率切换
const onCustomRateToggle = (checked) => {
  if (checked) selectedRate.value = null
}

// 监听弹窗打开，初始化数据
watch(() => props.modelValue, (visible) => {
  if (visible) {
    configStore.loadConfig()
    if (props.initialCostPrice > 0) costPrice.value = props.initialCostPrice
    if (props.initialQuantity > 0) quantity.value = props.initialQuantity
  }
})

onMounted(() => {
  configStore.loadConfig()
})
</script>

<style scoped>
.calculator-content {
  padding: 0 10px;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.profit-rate-options {
  margin-bottom: 10px;
}

.custom-rate {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.custom-rate .unit {
  margin-left: 6px;
  color: #909399;
}

.result-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
}

.result-item .label {
  color: #909399;
  font-size: 13px;
}

.result-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.result-item.highlight {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.result-item.highlight .label {
  color: #409eff;
}

.result-item.highlight .value {
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
}
</style>
