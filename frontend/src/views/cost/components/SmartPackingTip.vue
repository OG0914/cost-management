<template>
  <div class="smart-packing-tip" :class="tipType">
    <el-icon><InfoFilled v-if="tipType === 'domestic'" /><WarningFilled v-else /></el-icon>
    <div class="tip-content">
      <div class="tip-title">{{ title }}</div>
      <div v-if="tipType === 'domestic'">
        <div>当前数量: {{ quantity }} pcs ({{ (quantity / pcsPerCarton).toFixed(1) }}箱)</div>
        <div>建议数量: <strong>{{ suggestedQuantity }} pcs</strong> ({{ suggestedCartons }}箱) 以达到整数箱</div>
      </div>
      <div v-else>当前CBM为 <strong>{{ cbm }}</strong> (超过58)，建议选择整柜运输或联系物流单独确认运费。</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled, WarningFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'SmartPackingTip' })

const props = defineProps({
  quantity: { type: Number, default: 0 },
  pcsPerCarton: { type: Number, default: 1 },
  cbm: { type: [String, Number], default: null },
  tipType: { type: String, default: 'domestic' } // 'domestic' | 'warning'
})

const title = computed(() => props.tipType === 'domestic' ? '智能装箱建议:' : '运输建议:')
const suggestedCartons = computed(() => Math.ceil(props.quantity / props.pcsPerCarton))
const suggestedQuantity = computed(() => suggestedCartons.value * props.pcsPerCarton)
</script>

<style scoped>
.smart-packing-tip { display: flex; gap: 10px; padding: 12px 14px; border-radius: 8px; margin-top: 12px; font-size: 13px; line-height: 1.5; }
.smart-packing-tip.domestic { background: linear-gradient(135deg, #e8f4ff 0%, #d6eaff 100%); color: #1e40af; }
.smart-packing-tip.warning { background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%); color: #92400e; }
.tip-content { flex: 1; }
.tip-title { font-weight: 600; margin-bottom: 4px; }
</style>
