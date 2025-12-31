<template>
  <el-dialog
    :model-value="modelValue"
    title="利润计算器"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    destroy-on-close
    append-to-body
    class="profit-calculator-dialog"
  >
    <div class="calculator-content">
      <!-- 成本价输入 -->
      <div class="form-row">
        <label>成本价 ({{ currency }})</label>
        <el-input 
          v-model.number="costPrice" 
          placeholder="请输入成本价"
          clearable
        />
      </div>

      <!-- 利润率选择 -->
      <div class="form-row">
        <label>利润率</label>
        <div class="rate-btns">
          <button 
            v-for="rate in profitTiers" 
            :key="rate"
            type="button"
            class="rate-btn"
            :class="{ active: !useCustomRate && selectedRate === rate }"
            @click="selectRate(rate)"
          >
            {{ (rate * 100).toFixed(0) }}%
          </button>
        </div>
        <div class="custom-rate-row">
          <el-checkbox v-model="useCustomRate" @change="onCustomRateToggle">自定义</el-checkbox>
          <el-input
            v-if="useCustomRate"
            v-model.number="customRate"
            placeholder="0"
            style="width: 80px; margin-left: 12px;"
          />
          <span v-if="useCustomRate" class="percent-sign">%</span>
        </div>
      </div>

      <!-- 数量输入 -->
      <div class="form-row">
        <label>订单数量 (PCS)</label>
        <el-input 
          v-model.number="quantity" 
          placeholder="请输入数量"
          clearable
        />
      </div>

      <!-- 计算结果 -->
      <div class="result-card" v-if="parseFloat(costPrice) > 0 && parseInt(quantity) > 0">
        <div class="result-header">计算结果</div>
        <div class="result-list">
          <div class="result-row-item">
            <span class="result-label">单片卖价</span>
            <span class="result-value">{{ formatNumber(result.unitPrice) }} {{ currency }}</span>
          </div>
          <div class="result-row-item">
            <span class="result-label">单片利润</span>
            <span class="result-value">{{ formatNumber(result.unitProfit) }} {{ currency }}</span>
          </div>
          <div class="result-row-item total">
            <span class="result-label">💰 总利润</span>
            <span class="result-value">{{ result.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ currency }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-hint" v-else>
        请输入成本价和数量查看计算结果
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
  currency: { type: String, default: 'CNY' }
})

defineEmits(['update:modelValue'])

const configStore = useConfigStore()

const costPrice = ref(0)
const quantity = ref(10000)
const selectedRate = ref(0.25)
const useCustomRate = ref(false)
const customRate = ref(15)

const profitTiers = computed(() => configStore.config.profit_tiers || [0.05, 0.10, 0.25, 0.50])

const effectiveRate = computed(() => {
  if (useCustomRate.value) return (parseFloat(customRate.value) || 0) / 100
  return selectedRate.value
})

const result = computed(() => {
  const cost = parseFloat(costPrice.value) || 0
  const rate = effectiveRate.value
  const qty = parseInt(quantity.value) || 0
  if (cost <= 0 || rate < 0 || qty <= 0) return { unitPrice: 0, unitProfit: 0, totalProfit: 0 }
  const unitPrice = cost / (1 - rate)
  const unitProfit = unitPrice - cost
  const totalProfit = unitProfit * qty
  return { unitPrice, unitProfit, totalProfit }
})

const selectRate = (rate) => {
  useCustomRate.value = false
  selectedRate.value = rate
}

const onCustomRateToggle = (checked) => {
  if (checked) selectedRate.value = null
}

watch(() => props.modelValue, (visible) => {
  if (visible) {
    configStore.loadConfig()
    if (props.initialCostPrice > 0) costPrice.value = props.initialCostPrice
    if (props.initialQuantity > 0) quantity.value = props.initialQuantity
  }
})

onMounted(() => configStore.loadConfig())
</script>

<style scoped>
.calculator-content { padding: 4px 0; }

.form-row { margin-bottom: 20px; }
.form-row label { display: block; font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 8px; }

.rate-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.rate-btn { padding: 8px 18px; border: 1px solid #dcdfe6; border-radius: 6px; background: #fff; font-size: 14px; color: #606266; cursor: pointer; transition: all 0.2s; }
.rate-btn:hover { border-color: #409eff; color: #409eff; }
.rate-btn.active { background: #409eff; border-color: #409eff; color: #fff; }

.custom-rate-row { display: flex; align-items: center; }
.percent-sign { margin-left: 4px; color: #909399; font-size: 14px; }

.result-card { background: #fafbfc; border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; margin-top: 12px; }
.result-header { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 14px; }
.result-list { display: flex; flex-direction: column; gap: 12px; }
.result-row-item { display: flex; justify-content: space-between; align-items: center; }
.result-label { font-size: 14px; color: #909399; }
.result-value { font-size: 14px; font-weight: 500; color: #303133; }
.result-row-item.total { padding-top: 12px; border-top: 1px dashed #ebeef5; margin-top: 4px; }
.result-row-item.total .result-label { font-weight: 600; color: #303133; }
.result-row-item.total .result-value { font-size: 18px; font-weight: 700; color: #409eff; }

.empty-hint { text-align: center; padding: 32px 0; color: #c0c4cc; font-size: 14px; }
</style>

<style>
.profit-calculator-dialog .el-dialog__header { padding-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.profit-calculator-dialog .el-dialog__body { padding: 20px 24px; }
</style>
