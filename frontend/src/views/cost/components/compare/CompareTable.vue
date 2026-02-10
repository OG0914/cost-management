<template>
  <el-card class="compare-card">
    <!-- 配置信息行 -->
    <div class="compare-row">
      <div class="row-label">配置信息</div>
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${quotations.length}, 1fr)` }">
        <div
          v-for="(quotation, index) in quotations"
          :key="`config-${quotation.id}`"
          class="compare-cell"
        >
          <!-- 配置信息 -->
          <div class="config-header">
            <div class="config-title">
              <span class="config-label">型号 {{ index + 1 }}</span>
              <h3>{{ quotation.model_name }}</h3>
              <div class="config-subtitle">{{ quotation.packaging_config_name || '标准配置' }}</div>
            </div>
            <div class="config-info">
              <div class="info-row">
                <span class="info-label">包装规格：</span>
                <span class="info-value">{{ quotation.pc_per_bag || 0 }}片/袋, {{ quotation.bags_per_box || 0 }}袋/盒, {{ quotation.boxes_per_carton || 0 }}盒/箱</span>
              </div>
              <div class="info-row">
                <span class="info-label">数量：</span>
                <span class="info-value">{{ formatNumber(quotation.quantity, 0) }}pcs</span>
              </div>
              <div class="info-row">
                <span class="info-label">报价单号：</span>
                <span class="info-value">{{ quotation.quotation_no }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">状态：</span>
                <span class="info-value">
                  <el-tag :type="getStatusType(quotation.status)" size="small">
                    {{ getStatusText(quotation.status) }}
                  </el-tag>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 原料明细行 -->
    <div class="compare-row">
      <div class="row-label">原料明细</div>
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${quotations.length}, 1fr)` }">
        <div
          v-for="quotation in quotations"
          :key="`material-${quotation.id}`"
          class="compare-cell"
        >
          <el-table
            :data="items[quotation.id]?.material?.items || []"
            border
            size="small"
            show-header
            max-height="300"
          >
            <el-table-column label="名称" prop="item_name" min-width="120" />
            <el-table-column label="用量" prop="usage_amount" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.usage_amount) }}
              </template>
            </el-table-column>
            <el-table-column label="单价" prop="unit_price" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.unit_price) }}
              </template>
            </el-table-column>
            <el-table-column label="小计" prop="subtotal" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.subtotal) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="subtotal">
            小计: <strong>{{ formatNumber(items[quotation.id]?.material?.total || 0) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- 工序明细行 -->
    <div class="compare-row">
      <div class="row-label">工序明细</div>
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${quotations.length}, 1fr)` }">
        <div
          v-for="quotation in quotations"
          :key="`process-${quotation.id}`"
          class="compare-cell"
        >
          <el-table
            :data="items[quotation.id]?.process?.items || []"
            border
            size="small"
            show-header
            max-height="300"
          >
            <el-table-column label="名称" prop="item_name" min-width="120" />
            <el-table-column label="用量" prop="usage_amount" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.usage_amount) }}
              </template>
            </el-table-column>
            <el-table-column label="单价" prop="unit_price" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.unit_price) }}
              </template>
            </el-table-column>
            <el-table-column label="小计" prop="subtotal" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.subtotal) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="subtotal">
            小计: <strong>{{ formatNumber(items[quotation.id]?.process?.displayTotal || 0) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- 包材明细行 -->
    <div class="compare-row">
      <div class="row-label">包材明细</div>
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${quotations.length}, 1fr)` }">
        <div
          v-for="quotation in quotations"
          :key="`packaging-${quotation.id}`"
          class="compare-cell"
        >
          <el-table
            :data="items[quotation.id]?.packaging?.items || []"
            border
            size="small"
            show-header
            max-height="300"
          >
            <el-table-column label="名称" prop="item_name" min-width="120" />
            <el-table-column label="用量" prop="usage_amount" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.usage_amount) }}
              </template>
            </el-table-column>
            <el-table-column label="单价" prop="unit_price" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.unit_price) }}
              </template>
            </el-table-column>
            <el-table-column label="小计" prop="subtotal" width="80" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.subtotal) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="subtotal">
            小计: <strong>{{ formatNumber(items[quotation.id]?.packaging?.total || 0) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- 成本计算行 -->
    <div class="compare-row">
      <div class="row-label">成本计算</div>
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${quotations.length}, 1fr)` }">
        <div
          v-for="quotation in quotations"
          :key="`cost-${quotation.id}`"
          class="compare-cell"
        >
          <div class="cost-section">
            <div class="cost-items">
              <div class="cost-item">
                <span class="cost-label">运费成本：</span>
                <span class="cost-value">{{ formatNumber(calculations[quotation.id]?.freightCost) }}</span>
              </div>
              <div class="cost-item">
                <span class="cost-label">基础成本价：</span>
                <span class="cost-value">{{ formatNumber(calculations[quotation.id]?.baseCost) }}</span>
              </div>
              <div class="cost-item">
                <span class="cost-label">管销价：</span>
                <span class="cost-value">{{ formatNumber(calculations[quotation.id]?.overheadPrice) }}</span>
              </div>
              <div class="cost-item final-price-row">
                <span class="cost-label">{{ quotation.sales_type === 'domestic' ? '最终价（含税）：' : '最终价（USD）：' }}</span>
                <span class="final-price">
                  {{ formatNumber(quotation.sales_type === 'domestic'
                    ? calculations[quotation.id]?.domesticPrice
                    : calculations[quotation.id]?.insurancePrice) }}
                  {{ quotation.currency }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  quotations: {
    type: Array,
    default: () => []
  },
  items: {
    type: Object,
    default: () => ({})
  },
  calculations: {
    type: Object,
    default: () => ({})
  },
  getStatusType: {
    type: Function,
    required: true
  },
  getStatusText: {
    type: Function,
    required: true
  },
  formatNumber: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
.compare-card {
  margin-bottom: 20px;
}

.compare-row {
  display: flex;
  border-bottom: 2px solid #e4e7ed;
  padding: 20px 0;
}

.compare-row:last-child {
  border-bottom: none;
}

.row-label {
  width: 120px;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding: 10px 20px 10px 0;
  border-right: 3px solid #409eff;
  display: flex;
  align-items: flex-start;
}

.row-content {
  flex: 1;
  display: grid;
  gap: 20px;
  padding-left: 20px;
}

.compare-cell {
  min-width: 0;
}

.config-header {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 2px solid #e4e7ed;
}

.config-title {
  margin-bottom: 10px;
}

.config-label {
  display: inline-block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.config-header h3 {
  margin: 5px 0 5px 0;
  color: #409eff;
  font-size: 20px;
  font-weight: bold;
}

.config-subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: normal;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 3px 0;
}

.info-label {
  color: #909399;
  font-weight: 500;
}

.info-value {
  color: #606266;
  font-weight: normal;
}

.subtotal {
  text-align: right;
  padding: 10px;
  background-color: #f5f7fa;
  margin-top: 5px;
  border-radius: 4px;
  font-size: 14px;
}

.subtotal strong {
  color: #409eff;
  font-size: 16px;
}

.cost-section {
  background-color: #ecf5ff;
  padding: 15px;
  border-radius: 4px;
}

.cost-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  font-size: 14px;
  min-height: 40px;
}

.cost-label {
  color: #606266;
  font-weight: 500;
}

.cost-value {
  color: #303133;
  font-weight: bold;
}

.final-price-row {
  background-color: #fff3e0;
  border: 2px solid #e6a23c;
  padding: 12px;
  min-height: 50px;
}

.final-price {
  color: #e6a23c;
  font-size: 18px;
  font-weight: bold;
}
</style>
