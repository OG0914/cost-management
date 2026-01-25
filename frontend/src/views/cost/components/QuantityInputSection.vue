<template>
  <div class="quantity-input-section">
    <el-row :gutter="24">
      <el-col :span="12">
        <el-form-item label="数量单位">
          <el-radio-group :model-value="quantityUnit" @update:model-value="$emit('update:quantityUnit', $event)" :disabled="!pcsPerCarton">
            <el-radio value="pcs">按片</el-radio>
            <el-radio value="carton">按箱</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="quantityUnit === 'pcs' ? quantityLabelPcs : quantityLabelCarton" prop="quantity" class="compact-required-label">
          <el-input-number :model-value="quantityInput" @update:model-value="handleQuantityChange" :min="1" :precision="0" :controls="false" style="width: 100%" />
          <div v-if="quantityUnit === 'carton' && pcsPerCarton" class="quantity-hint">= {{ totalPcs }} 片（{{ quantityInput }}箱 × {{ pcsPerCarton }}片/箱）</div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="24" v-if="showCartonInfo">
      <el-col :span="12">
        <el-form-item label="箱数">
          <div class="readonly-value-box">{{ cartons || '-' }}</div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="CBM">
          <div class="readonly-value-box">{{ cbm || '-' }}</div>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 智能装箱建议 -->
    <div v-if="showPackingTip" class="smart-packing-tip">
      <el-icon><InfoFilled /></el-icon>
      <div class="tip-content">
        <div class="tip-title">智能装箱建议:</div>
        <div>当前数量: {{ quantity }} pcs ({{ currentCartonCount }}箱)</div>
        <div>建议数量: <strong>{{ suggestedQuantity }} pcs</strong> ({{ suggestedCartonCount }}箱) 以达到整数箱</div>
      </div>
    </div>

    <!-- CBM过大警告 -->
    <div v-if="showCbmWarning" class="smart-packing-tip warning">
      <el-icon><WarningFilled /></el-icon>
      <div class="tip-content">
        <div class="tip-title">运输建议:</div>
        <div>当前CBM为 <strong>{{ cbm }}</strong> (超过58)，建议选择整柜运输或联系物流单独确认运费。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled, WarningFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'QuantityInputSection' })

const props = defineProps({
  quantityUnit: { type: String, default: 'pcs' },
  quantityInput: { type: Number, default: null },
  quantity: { type: Number, default: null },
  pcsPerCarton: { type: Number, default: null },
  cartons: { type: [String, Number], default: null },
  cbm: { type: [String, Number], default: null },
  quantityLabelPcs: { type: String, default: '购买数量(片)' },
  quantityLabelCarton: { type: String, default: '购买数量(箱)' },
  showCartonInfo: { type: Boolean, default: true }
})

const emit = defineEmits(['update:quantityUnit', 'update:quantityInput', 'change'])

const MAX_LCL_CBM = 58 // 散货最大CBM阈值

const totalPcs = computed(() => props.quantityInput && props.pcsPerCarton ? props.quantityInput * props.pcsPerCarton : 0)
const currentCartonCount = computed(() => props.pcsPerCarton ? (props.quantity / props.pcsPerCarton).toFixed(1) : 0)
const suggestedCartonCount = computed(() => props.pcsPerCarton ? Math.ceil(props.quantity / props.pcsPerCarton) : 0)
const suggestedQuantity = computed(() => suggestedCartonCount.value * props.pcsPerCarton)

const showPackingTip = computed(() => {
  return props.quantityUnit === 'pcs' && props.quantity && props.pcsPerCarton && (props.quantity % props.pcsPerCarton !== 0)
})

const showCbmWarning = computed(() => {
  return props.cbm && parseFloat(props.cbm) > MAX_LCL_CBM
})

const handleQuantityChange = (val) => {
  emit('update:quantityInput', val)
  emit('change', val)
}
</script>

<style scoped>
.quantity-input-section { margin-top: 16px; }
.quantity-hint { color: #67c23a; font-size: 12px; margin-top: 4px; }
.readonly-value-box { background-color: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 4px; padding: 0 12px; height: 32px; line-height: 32px; color: #606266; width: 100%; }
.compact-required-label :deep(.el-form-item__label) { padding-right: 4px; }
.compact-required-label :deep(.el-form-item__label::before) { margin-right: 2px !important; }

.smart-packing-tip { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 6px; margin: 12px 0; }
.smart-packing-tip .el-icon { color: #e6a23c; font-size: 18px; margin-top: 2px; }
.tip-content { flex: 1; }
.tip-title { font-weight: 600; color: #e6a23c; margin-bottom: 4px; }
.tip-content div { color: #606266; font-size: 13px; line-height: 1.6; }

.smart-packing-tip.warning { background: #fef0f0; border: 1px solid #fde2e2; }
.smart-packing-tip.warning .el-icon { color: #f56c6c; }
.smart-packing-tip.warning .tip-title { color: #f56c6c; }
</style>
