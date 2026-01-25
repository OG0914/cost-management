<template>
  <div class="cost-section">
    <div class="cost-section-header">
      <h3 class="cost-section-title">销售类型</h3>
    </div>
    <div class="cost-section-body">
      <!-- 销售类型选择 -->
      <div class="sales-type-group">
        <div class="sales-type-card" :class="{ active: salesType === 'domestic' }" @click="$emit('update:salesType', 'domestic'); $emit('change')">
          <div class="sales-type-header"><span class="sales-type-title">内销</span><span class="sales-type-badge">CNY</span></div>
          <div class="sales-type-desc">含 {{ vatRatePercent }}% 增值税</div>
        </div>
        <div class="sales-type-card" :class="{ active: salesType === 'export' }" @click="$emit('update:salesType', 'export'); $emit('change')">
          <div class="sales-type-header"><span class="sales-type-title">外销</span><span class="sales-type-badge">USD</span></div>
          <div class="sales-type-desc">FOB 条款 / 0% 税率</div>
        </div>
      </div>

      <!-- 内销增值税率 -->
      <div v-if="salesType === 'domestic'" class="vat-rate-section">
        <el-form-item label="增值税率" prop="vat_rate">
          <el-select :model-value="vatRate" @update:model-value="$emit('update:vatRate', $event); $emit('calculate')" placeholder="请选择增值税率" style="width: 200px">
            <el-option v-for="rate in vatRateOptions" :key="rate" :label="`${(rate * 100).toFixed(0)}%`" :value="rate" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 内销数量输入 -->
      <div v-if="salesType === 'domestic'" class="domestic-quantity-section">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="数量单位">
              <el-radio-group :model-value="quantityUnit" @update:model-value="$emit('update:quantityUnit', $event); $emit('quantityUnitChange')" :disabled="!pcsPerCarton">
                <el-radio value="pcs">按片</el-radio><el-radio value="carton">按箱</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="quantityUnit === 'pcs' ? '购买数量(片)' : '购买数量(箱)'" prop="quantity" class="compact-required-label">
              <el-input-number :model-value="quantityInput" @update:model-value="$emit('update:quantityInput', $event); $emit('quantityInputChange')" :min="1" :precision="0" :controls="false" style="width: 100%" />
              <div v-if="quantityUnit === 'carton' && pcsPerCarton" class="quantity-hint">= {{ quantity }} 片（{{ quantityInput }}箱 × {{ pcsPerCarton }}片/箱）</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24" v-if="cartons !== null || cbm !== null">
          <el-col :span="12"><el-form-item label="箱数"><div class="readonly-value-box">{{ cartons || '-' }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="CBM"><div class="readonly-value-box">{{ cbm || '-' }}</div></el-form-item></el-col>
        </el-row>
        <SmartPackingTip v-if="showPackingTip" :quantity="quantity" :pcs-per-carton="pcsPerCarton" />
        <el-row :gutter="24" class="domestic-freight-row">
          <el-col :span="12"><el-form-item label="每CBM单价"><el-input-number :model-value="cbmPrice" @update:model-value="$emit('update:cbmPrice', $event); $emit('cbmPriceChange')" :min="0" :precision="2" :controls="false" style="width: 100%" placeholder="0" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="运费总价" prop="freight_total" class="compact-required-label">
              <el-input-number :model-value="freightTotal" @update:model-value="$emit('update:freightTotal', $event); $emit('calculate')" :min="0" :precision="2" :controls="false" style="width: 100%" />
              <div v-if="cbmPrice && cbm" class="freight-hint">= {{ cbmPrice }} × {{ Math.ceil(parseFloat(cbm)) }} CBM</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="运费计入成本" required class="wide-label-item">
              <el-radio-group :model-value="includeFreight" @update:model-value="$emit('update:includeFreight', $event); $emit('calculate')">
                <el-radio :value="true">是</el-radio><el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <slot name="export-freight"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SmartPackingTip from './SmartPackingTip.vue'

defineOptions({ name: 'SalesTypeSection' })

const props = defineProps({
  salesType: { type: String, default: 'domestic' },
  vatRate: { type: Number, default: 0.13 },
  vatRateOptions: { type: Array, default: () => [0.13, 0.09, 0.06, 0] },
  quantityUnit: { type: String, default: 'pcs' },
  quantityInput: { type: Number, default: 1 },
  quantity: { type: Number, default: 0 },
  pcsPerCarton: { type: Number, default: null },
  cartons: { type: Number, default: null },
  cbm: { type: String, default: null },
  cbmPrice: { type: Number, default: 0 },
  freightTotal: { type: Number, default: 0 },
  includeFreight: { type: Boolean, default: true }
})

defineEmits(['update:salesType', 'update:vatRate', 'update:quantityUnit', 'update:quantityInput', 'update:cbmPrice', 'update:freightTotal', 'update:includeFreight', 'change', 'calculate', 'quantityUnitChange', 'quantityInputChange', 'cbmPriceChange'])

const vatRatePercent = computed(() => ((props.vatRate || 0.13) * 100).toFixed(0))
const showPackingTip = computed(() => props.quantityUnit === 'pcs' && props.quantity && props.pcsPerCarton && (props.quantity % props.pcsPerCarton !== 0))
</script>

<style scoped>
.cost-section { background: #fff; border: 1px solid #e4e7ed; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
.cost-section-header { padding: 14px 16px; border-bottom: 1px solid #e4e7ed; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
.cost-section-title { font-size: 15px; font-weight: 600; color: #303133; margin: 0; }
.cost-section-body { padding: 16px; }

.sales-type-group { display: flex; gap: 12px; margin-bottom: 16px; }
.sales-type-card { flex: 1; padding: 16px; border: 2px solid #e4e7ed; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: #fafafa; }
.sales-type-card:hover { border-color: #409eff; background: #ecf5ff; }
.sales-type-card.active { border-color: #409eff; background: linear-gradient(135deg, #ecf5ff 0%, #e0f0ff 100%); }
.sales-type-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.sales-type-title { font-size: 16px; font-weight: 600; color: #303133; }
.sales-type-badge { font-size: 12px; padding: 2px 8px; background: #f0f0f0; border-radius: 10px; color: #606266; }
.sales-type-card.active .sales-type-badge { background: #409eff; color: #fff; }
.sales-type-desc { font-size: 12px; color: #909399; }

.vat-rate-section { margin-bottom: 16px; }
.domestic-quantity-section { margin-top: 16px; }
.quantity-hint { font-size: 12px; color: #909399; margin-top: 4px; }
.readonly-value-box { padding: 8px 12px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 4px; font-size: 14px; color: #303133; min-height: 32px; display: inline-flex; align-items: center; }
.freight-hint { font-size: 12px; color: #909399; margin-top: 4px; }
.domestic-freight-row { margin-top: 16px; }
</style>
