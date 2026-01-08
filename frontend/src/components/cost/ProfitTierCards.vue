<template>
  <div class="cost-section">
    <div class="cost-section-header">
      <h3 class="cost-section-title">
        <i class="ri-percent-line bg-amber-500"></i>
        利润区间
      </h3>
      <el-button type="primary" size="small" @click="$emit('add-tier')">
        <i class="ri-add-line mr-1"></i>添加档位
      </el-button>
    </div>
    <div class="cost-section-body">
      <div class="profit-tier-grid">
        <div 
          v-for="tier in allTiers" 
          :key="tier.isCustom ? 'custom-' + tier.customIndex : 'system-' + tier.profitPercentage" 
          class="profit-tier-card" 
          :class="{ custom: tier.isCustom }"
        >
          <div class="profit-tier-label">
            <template v-if="!tier.isCustom">{{ tier.profitPercentage }} 利润</template>
            <template v-else>
              <div class="flex items-center gap-1">
                <el-input 
                  v-model="tier.originalTier.profitRate" 
                  placeholder="如0.35" 
                  size="small" 
                  style="width: 60px" 
                  @input="$emit('update-custom-tier', tier.originalTier)" 
                />
                <span v-if="tier.originalTier.profitRate" class="text-xs text-blue-600">
                  {{ (parseFloat(tier.originalTier.profitRate) * 100).toFixed(0) }}%
                </span>
              </div>
            </template>
          </div>
          <div class="profit-tier-value">{{ formatNumber(tier.price) }} {{ currency }}</div>
          <el-button 
            v-if="tier.isCustom" 
            type="danger" 
            size="small" 
            link 
            @click="$emit('remove-tier', tier.customIndex)" 
            class="profit-tier-remove"
          >
            <i class="ri-close-line"></i>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatNumber } from '@/utils/format'

defineProps({
  allTiers: { type: Array, required: true },
  currency: { type: String, default: 'CNY' }
})

defineEmits(['add-tier', 'remove-tier', 'update-custom-tier'])
</script>
