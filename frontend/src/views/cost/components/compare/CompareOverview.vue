<template>
  <el-card class="overview-card" v-if="quotations.length > 0">
    <template #header>
      <span class="section-title">对比概览</span>
    </template>

    <!-- 对比配置列表 -->
    <div class="config-list">
      <div
        v-for="(quotation, index) in quotations"
        :key="`overview-${quotation.id}`"
        class="config-item"
      >
        <div class="config-number">型号 {{ index + 1 }}</div>
        <div class="config-details">
          <div class="config-name">
            <strong>{{ quotation.model_name }}</strong>
          </div>
          <div class="config-subtitle">
            {{ quotation.packaging_config_name || '标准配置' }}
          </div>
          <div class="config-spec">
            包装：{{ quotation.pc_per_bag || 0 }}片/袋, {{ quotation.bags_per_box || 0 }}袋/盒, {{ quotation.boxes_per_carton || 0 }}盒/箱
          </div>
          <div class="config-quantity">
            数量：{{ formatNumber(quotation.quantity, 0) }}pcs
          </div>
          <div class="config-price">
            最终价：<span class="price-value">{{ formatNumber(quotation.sales_type === 'domestic'
              ? calculations[quotation.id]?.domesticPrice
              : calculations[quotation.id]?.insurancePrice) }} {{ quotation.currency }}</span>
          </div>
          <div class="config-profit">
            <div class="profit-title">利润区间报价</div>
            <div class="profit-list">
              <div
                v-for="tier in getAllProfitTiers(quotation)"
                :key="`profit-${quotation.id}-${tier.profitPercentage}`"
                class="profit-item"
                :class="{ 'custom-tier': tier.isCustom }"
              >
                <span class="profit-rate">{{ tier.profitPercentage }}</span>
                <span class="profit-price">{{ formatNumber(tier.price) }} {{ quotation.currency }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="overview-actions">
      <el-button icon="Printer" @click="onPrint">打印</el-button>
      <el-button type="primary" icon="Download" @click="onExport">导出对比报告</el-button>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  quotations: {
    type: Array,
    default: () => []
  },
  calculations: {
    type: Object,
    default: () => ({})
  },
  getAllProfitTiers: {
    type: Function,
    required: true
  },
  formatNumber: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['print', 'export'])

const onPrint = () => emit('print')
const onExport = () => emit('export')
</script>

<style scoped>
.overview-card {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.config-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.config-item {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}

.config-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.config-number {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-name {
  font-size: 18px;
  color: #409eff;
  margin-bottom: 2px;
}

.config-subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.config-spec,
.config-quantity {
  font-size: 13px;
  color: #606266;
}

.config-price {
  font-size: 14px;
  color: #303133;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

.price-value {
  font-size: 16px;
  font-weight: bold;
  color: #e6a23c;
  margin-left: 5px;
}

.config-profit {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.profit-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.profit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 4px 0;
}

.profit-rate {
  color: #606266;
}

.profit-price {
  color: #67c23a;
  font-weight: 500;
}

.profit-item.custom-tier {
  background-color: #fef0e6;
  padding: 4px 8px;
  border-radius: 4px;
  margin: 2px 0;
}

.profit-item.custom-tier .profit-rate {
  color: #E6A23C;
  font-weight: 600;
}

.profit-item.custom-tier .profit-price {
  color: #E6A23C;
}

.overview-actions {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
