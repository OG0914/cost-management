<template>
  <div class="cost-preview-sticky">
    <!-- 成本计算 -->
    <div class="preview-section" v-if="calculation">
      <div class="preview-section-title">成本计算</div>
      <div class="preview-cost-grid">
        <div class="preview-cost-item">
          <el-tooltip content="原料 + 工序×系数 + 包材" placement="top">
            <span class="preview-cost-label cursor-help">基础成本 <el-icon class="text-gray-400"><InfoFilled /></el-icon></span>
          </el-tooltip>
          <span class="preview-cost-value">{{ formatNumber(calculation.baseCost) }}</span>
        </div>
        <div class="preview-cost-item">
          <el-tooltip content="运费总价 ÷ 数量" placement="top">
            <span class="preview-cost-label cursor-help">运费成本 <el-icon class="text-gray-400"><InfoFilled /></el-icon></span>
          </el-tooltip>
          <span class="preview-cost-value">{{ calculation.freightCost > 0.001 ? formatNumber(calculation.freightCost) : '-' }}</span>
        </div>
        <div class="preview-cost-item">
          <el-tooltip :content="`(基础成本${includeFreightInBase ? '+运费' : ''}) ÷ (1-${overheadRatePercent}%)`" placement="top">
            <span class="preview-cost-label cursor-help">管销价 <span class="text-blue-500">{{ overheadRatePercent }}%</span></span>
          </el-tooltip>
          <span class="preview-cost-value">{{ formatNumber(calculation.overheadPrice) }}</span>
        </div>
      </div>
      <el-button size="small" type="primary" link @click="$emit('showAddFeeDialog')" class="mt-2">+ 添加费用项</el-button>
      <div v-if="customFeesWithValues.length > 0" class="preview-fee-list">
        <div v-for="(fee, index) in customFeesWithValues" :key="'fee-' + index" class="preview-fee-item">
          <span>{{ fee.name }} ({{ (fee.rate * 100).toFixed(0) }}%)</span>
          <div class="flex items-center gap-2"><span class="font-medium">{{ formatNumber(fee.calculatedValue) }}</span><el-button size="small" type="danger" link @click="$emit('removeCustomFee', index)">删除</el-button></div>
        </div>
      </div>
      <div v-if="calculation.afterOverheadMaterialTotal > 0" class="preview-tip">管销后原料: <strong>{{ formatNumber(calculation.afterOverheadMaterialTotal) }}</strong></div>
    </div>

    <!-- 最终成本价 -->
    <div class="preview-final-box" v-if="calculation">
      <div class="preview-final-label">最终成本价</div>
      <div class="preview-final-value">
        <span v-if="salesType === 'domestic'">{{ formatNumber(calculation.domesticPrice) }}</span>
        <span v-else>{{ formatNumber(calculation.insurancePrice) }}</span>
        <span class="preview-final-currency">{{ salesType === 'domestic' ? 'CNY' : 'USD' }}</span>
      </div>
      <div class="preview-final-info">
        <span v-if="salesType === 'export'">汇率 {{ formatNumber(calculation.exchangeRate) }} | 保险 0.3%</span>
        <span v-else>含 {{ vatRatePercent }}% 增值税</span>
      </div>
    </div>

    <!-- 利润区间 -->
    <div class="preview-section" v-if="calculation && calculation.profitTiers">
      <div class="preview-section-header">
        <span class="preview-section-title">利润区间</span>
        <el-button type="primary" size="small" link @click="$emit('addCustomProfitTier')">+ 添加</el-button>
      </div>
      <!-- 滑块 -->
      <div class="preview-slider">
        <div class="preview-slider-header">
          <span class="text-xs text-gray-400">{{ sliderProfitRate }}%</span>
          <span class="text-sm font-semibold text-blue-600">{{ formatNumber(sliderPrice) }} {{ calculation.currency }}</span>
        </div>
        <el-slider v-model="sliderProfitRate" :min="0" :max="100" :step="1" :show-tooltip="false" />
      </div>
      <!-- 档位 -->
      <div class="preview-tier-list">
        <div v-for="tier in allProfitTiers" :key="tier.isCustom ? 'custom-' + tier.customIndex : 'system-' + tier.profitPercentage" class="preview-tier-item" :class="{ custom: tier.isCustom }" @click="!tier.isCustom && setSliderFromTier(tier)">
          <div class="preview-tier-left">
            <span v-if="!tier.isCustom" class="preview-tier-rate">{{ tier.profitPercentage }}</span>
            <el-input v-else v-model="tier.originalTier.profitRate" placeholder="0.35" size="small" style="width: 50px" @input="$emit('updateCustomTierPrice', tier.originalTier)" @click.stop />
          </div>
          <div class="preview-tier-right">
            <span class="preview-tier-price">{{ formatNumber(tier.price) }}</span>
            <span v-if="!tier.isCustom" class="preview-tier-profit">+{{ formatNumber(tier.price - basePrice) }}</span>
            <el-button v-if="tier.isCustom" type="danger" size="small" link @click.stop="$emit('removeCustomProfitTier', tier.customIndex)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!calculation" class="preview-empty">
      <el-icon class="text-4xl text-gray-300 mb-2"><Document /></el-icon>
      <p class="text-sm text-gray-400">选择型号配置后</p>
      <p class="text-sm text-gray-400">将实时显示成本计算</p>
    </div>

    <!-- 操作按钮 -->
    <div class="preview-actions">
      <div class="preview-actions-row">
        <el-button @click="$emit('saveDraft')" :loading="saving" class="action-draft">
          <el-icon><FolderAdd /></el-icon>草稿
        </el-button>
        <el-button type="primary" @click="$emit('submit')" :loading="submitting" class="action-submit">
          <el-icon><Promotion /></el-icon>提交审核
        </el-button>
      </div>
      <el-button text @click="$emit('cancel')" class="action-cancel">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { InfoFilled, Document, FolderAdd, Promotion } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/format'

defineOptions({ name: 'CostPreviewPanel' })

const props = defineProps({
  calculation: { type: Object, default: null },
  salesType: { type: String, default: 'domestic' },
  vatRate: { type: Number, default: 0.13 },
  overheadRate: { type: Number, default: 0.2 },
  includeFreightInBase: { type: Boolean, default: true },
  customFeesWithValues: { type: Array, default: () => [] },
  allProfitTiers: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false }
})

defineEmits(['submit', 'saveDraft', 'cancel', 'showAddFeeDialog', 'removeCustomFee', 'addCustomProfitTier', 'removeCustomProfitTier', 'updateCustomTierPrice'])

const sliderProfitRate = ref(25)
const overheadRatePercent = computed(() => ((props.overheadRate || 0.2) * 100).toFixed(0))
const vatRatePercent = computed(() => ((props.vatRate || 0.13) * 100).toFixed(0))
const basePrice = computed(() => props.calculation ? (props.salesType === 'domestic' ? props.calculation.domesticPrice : props.calculation.insurancePrice) : 0)
const sliderPrice = computed(() => {
  if (!props.calculation) return 0
  return basePrice.value / (1 - sliderProfitRate.value / 100)
})
const setSliderFromTier = (tier) => { sliderProfitRate.value = parseInt(tier.profitPercentage) || 0 }
</script>

<style scoped>
.cost-preview-sticky { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; }
.preview-section { background: #fff; border: 1px solid #e4e7ed; border-radius: 10px; padding: 14px; }
.preview-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.preview-section-title { font-size: 13px; font-weight: 600; color: #303133; }
.preview-cost-grid { display: flex; flex-direction: column; gap: 8px; }
.preview-cost-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #f8fafc; border-radius: 6px; }
.preview-cost-label { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; }
.preview-cost-value { font-size: 14px; font-weight: 600; color: #1e293b; }
.preview-fee-list { margin-top: 10px; }
.preview-fee-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #fef3c7; border-radius: 4px; font-size: 12px; color: #92400e; margin-bottom: 6px; }
.preview-tip { margin-top: 8px; padding: 8px 10px; background: #fef3c7; border-radius: 4px; font-size: 12px; color: #92400e; }
.preview-final-box { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); border-radius: 10px; padding: 16px; text-align: center; color: #fff; }
.preview-final-label { font-size: 12px; opacity: 0.9; margin-bottom: 4px; }
.preview-final-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.preview-final-currency { font-size: 14px; font-weight: 500; margin-left: 4px; opacity: 0.9; }
.preview-final-info { font-size: 11px; opacity: 0.8; margin-top: 6px; }
.preview-slider { margin-bottom: 12px; }
.preview-slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.preview-tier-list { display: flex; flex-direction: column; gap: 6px; }
.preview-tier-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; }
.preview-tier-item:not(.custom):hover { border-color: #3b82f6; background: #eff6ff; }
.preview-tier-item.custom { background: #fef3c7; border-color: #fbbf24; }
.preview-tier-left { display: flex; align-items: center; gap: 6px; }
.preview-tier-rate { font-size: 12px; font-weight: 500; color: #64748b; min-width: 36px; }
.preview-tier-right { display: flex; align-items: center; gap: 8px; }
.preview-tier-price { font-size: 13px; font-weight: 600; color: #1e293b; }
.preview-tier-profit { font-size: 11px; color: #22c55e; font-weight: 500; }
.preview-empty { background: #fff; border: 1px dashed #e4e7ed; border-radius: 10px; padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.preview-actions { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: #fff; border: 1px solid #e4e7ed; border-radius: 10px; }
.preview-actions-row { display: flex; gap: 8px; }
.action-draft { flex: 1; height: 40px; border: 1px solid #dcdfe6; background: #f8fafc; color: #475569; font-weight: 500; }
.action-draft:hover { background: #f1f5f9; border-color: #c0c4cc; }
.action-submit { flex: 2; height: 40px; font-weight: 600; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; }
.action-submit:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
.action-cancel { color: #94a3b8; font-size: 13px; }
.action-cancel:hover { color: #64748b; }
.cursor-help { cursor: help; }
</style>
