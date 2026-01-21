<template>
  <div class="cost-compare-container">
    <CostPageHeader title="成本对比分析" :show-back="true" @back="goBack" />

    <div v-loading="loading" class="compare-content">
      <!-- 对比概览 -->
      <el-card class="overview-card" v-if="compareData.quotations.length > 0">
        <template #header>
          <span class="section-title">对比概览</span>
        </template>
        
        <!-- 对比配置列表 -->
        <div class="config-list">
          <div 
            v-for="(quotation, index) in compareData.quotations" 
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
                  ? compareData.calculations[quotation.id]?.domesticPrice 
                  : compareData.calculations[quotation.id]?.insurancePrice) }} {{ quotation.currency }}</span>
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
          <el-button icon="Printer" @click="handlePrint">打印</el-button>
          <el-button type="primary" icon="Download" @click="handleExport">导出对比报告</el-button>
        </div>
      </el-card>

      <!-- 分栏对比 -->
      <el-card class="compare-card">
        <!-- 配置信息行 -->
        <div class="compare-row">
          <div class="row-label">配置信息</div>
          <div class="row-content" :style="{ gridTemplateColumns: `repeat(${compareData.quotations.length}, 1fr)` }">
            <div 
              v-for="(quotation, index) in compareData.quotations" 
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
          <div class="row-content" :style="{ gridTemplateColumns: `repeat(${compareData.quotations.length}, 1fr)` }">
            <div 
              v-for="quotation in compareData.quotations" 
              :key="`material-${quotation.id}`"
              class="compare-cell"
            >
              <el-table 
                :data="compareData.items[quotation.id]?.material?.items || []" 
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
                小计: <strong>{{ formatNumber(compareData.items[quotation.id]?.material?.total || 0) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 工序明细行 -->
        <div class="compare-row">
          <div class="row-label">工序明细</div>
          <div class="row-content" :style="{ gridTemplateColumns: `repeat(${compareData.quotations.length}, 1fr)` }">
            <div 
              v-for="quotation in compareData.quotations" 
              :key="`process-${quotation.id}`"
              class="compare-cell"
            >
              <el-table 
                :data="compareData.items[quotation.id]?.process?.items || []" 
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
                小计: <strong>{{ formatNumber(compareData.items[quotation.id]?.process?.displayTotal || 0) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 包材明细行 -->
        <div class="compare-row">
          <div class="row-label">包材明细</div>
          <div class="row-content" :style="{ gridTemplateColumns: `repeat(${compareData.quotations.length}, 1fr)` }">
            <div 
              v-for="quotation in compareData.quotations" 
              :key="`packaging-${quotation.id}`"
              class="compare-cell"
            >
              <el-table 
                :data="compareData.items[quotation.id]?.packaging?.items || []" 
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
                小计: <strong>{{ formatNumber(compareData.items[quotation.id]?.packaging?.total || 0) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 成本计算行 -->
        <div class="compare-row">
          <div class="row-label">成本计算</div>
          <div class="row-content" :style="{ gridTemplateColumns: `repeat(${compareData.quotations.length}, 1fr)` }">
            <div 
              v-for="quotation in compareData.quotations" 
              :key="`cost-${quotation.id}`"
              class="compare-cell"
            >
              <div class="cost-section">
              <div class="cost-items">
                <div class="cost-item">
                  <span class="cost-label">运费成本：</span>
                  <span class="cost-value">{{ formatNumber(compareData.calculations[quotation.id]?.freightCost) }}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">基础成本价：</span>
                  <span class="cost-value">{{ formatNumber(compareData.calculations[quotation.id]?.baseCost) }}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">管销价：</span>
                  <span class="cost-value">{{ formatNumber(compareData.calculations[quotation.id]?.overheadPrice) }}</span>
                </div>
                <div class="cost-item final-price-row">
                  <span class="cost-label">{{ quotation.sales_type === 'domestic' ? '最终价（含税）：' : '最终价（USD）：' }}</span>
                  <span class="final-price">
                    {{ formatNumber(quotation.sales_type === 'domestic' 
                      ? compareData.calculations[quotation.id]?.domesticPrice 
                      : compareData.calculations[quotation.id]?.insurancePrice) }}
                    {{ quotation.currency }}
                  </span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

      </el-card>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Printer, Download } from '@element-plus/icons-vue'
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import logger from '@/utils/logger'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const goBack = () => {
  router.back()
}

// 对比数据
const compareData = reactive({
  quotations: [],
  items: {},
  calculations: {}
})

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审核',
    rejected: '已退回'
  }
  return textMap[status] || status
}

// 获取所有利润档位（系统+自定义）
const getAllProfitTiers = (quotation) => {
  const systemTiers = compareData.calculations[quotation.id]?.profitTiers || []
  
  // 解析自定义利润档位
  let customTiers = []
  if (quotation.custom_profit_tiers) {
    try {
      customTiers = JSON.parse(quotation.custom_profit_tiers).map(tier => ({
        ...tier,
        isCustom: true
      }))
    } catch (e) {
      logger.error('解析自定义利润档位失败:', e)
    }
  }
  
  // 合并并排序
  const allTiers = [
    ...systemTiers.map(t => ({ ...t, isCustom: false })),
    ...customTiers
  ]
  allTiers.sort((a, b) => a.profitRate - b.profitRate)
  
  return allTiers
}

// 加载对比数据
const loadCompareData = async () => {
  const ids = route.query.ids
  if (!ids) {
    ElMessage.error('缺少报价单ID参数')
    router.push('/cost/records')
    return
  }

  const idArray = ids.split(',').map(id => parseInt(id))
  
  if (idArray.length < 2) {
    ElMessage.error('至少需要2个报价单进行对比')
    router.push('/cost/records')
    return
  }

  if (idArray.length > 4) {
    ElMessage.error('最多只能对比4个报价单')
    router.push('/cost/records')
    return
  }

  loading.value = true

  try {
    // 并发加载所有报价单详情
    const promises = idArray.map(id => request.get(`/cost/quotations/${id}`))
    const results = await Promise.all(promises)

    // 检查是否所有请求都成功
    const failedRequests = results.filter(res => !res.success)
    if (failedRequests.length > 0) {
      ElMessage.error('部分报价单加载失败')
      return
    }

    // 提取数据
    compareData.quotations = results.map(res => res.data.quotation)
    results.forEach(res => {
      const quotationId = res.data.quotation.id
      compareData.items[quotationId] = res.data.items
      compareData.calculations[quotationId] = res.data.calculation
    })

    // 验证是否为同一型号
    const firstQuotation = compareData.quotations[0]
    const allSameModel = compareData.quotations.every(
      q => q.model_id === firstQuotation.model_id
    )

    if (!allSameModel) {
      ElMessage.warning('提示：您选择的报价单不是同一型号，对比结果可能不准确')
    }

    const allSameCustomer = compareData.quotations.every(
      q => q.customer_name === firstQuotation.customer_name
    )

    if (!allSameCustomer) {
      ElMessage.info('提示：您选择的报价单来自不同客户')
    }

  } catch (error) {
    logger.error('加载对比数据失败:', error)
    ElMessage.error('加载对比数据失败')
  } finally {
    loading.value = false
  }
}



// 打印（只打印对比概览）
const handlePrint = () => {
  // 获取对比概览元素
  const overviewCard = document.querySelector('.overview-card')
  if (!overviewCard) {
    ElMessage.warning('未找到对比概览内容')
    return
  }

  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口，请检查浏览器设置')
    return
  }

  // 克隆内容并移除操作按钮
  const clonedCard = overviewCard.cloneNode(true)
  const actionsDiv = clonedCard.querySelector('.overview-actions')
  if (actionsDiv) {
    actionsDiv.remove()
  }

  // 构建打印内容 - 使用简化的样式
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>报价单对比 - ${new Date().toLocaleDateString()}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
          padding: 20px;
          font-size: 14px;
          line-height: 1.6;
          color: #303133;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: #303133;
        }
        
        h4 {
          margin-bottom: 10px;
          font-size: 16px;
          color: #303133;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 15px;
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
          page-break-inside: avoid;
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
          font-weight: bold;
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
        
        .profit-item.custom-tier {
          background-color: #fef0e6;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 2px 0;
        }
        
        .profit-rate {
          color: #606266;
        }
        
        .profit-item.custom-tier .profit-rate {
          color: #E6A23C;
          font-weight: 600;
        }
        
        .profit-price {
          color: #67c23a;
          font-weight: 500;
        }
        
        .profit-item.custom-tier .profit-price {
          color: #E6A23C;
        }
        
        @media print {
          body {
            padding: 10px;
          }
          
          .config-item {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <h1>报价单对比分析</h1>
      ${clonedCard.innerHTML}
    </body>
    </html>
  `)

  printWindow.document.close()
  
  // 等待内容加载完成后打印
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

// 导出报告
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
  // TODO: 实现导出Excel功能
}

onMounted(() => {
  loadCompareData()
})
</script>

<style scoped>
.cost-compare-container {
  /* padding 由 MainLayout 提供 */
}

.back-btn {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.compare-content {
  min-height: 400px;
}

.overview-card {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

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

.overview-highlight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 10px;
}

.model-highlight {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.model-highlight .label {
  font-size: 16px;
  font-weight: normal;
  opacity: 0.9;
}

.model-highlight .value {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 1px;
}

.compare-count {
  font-size: 14px;
  opacity: 0.9;
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

.detail-section {
  display: flex;
  flex-direction: column;
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

.profit-section {
  background-color: #f0f9ff;
  padding: 10px;
  border-radius: 4px;
}

/* 打印样式 */
@media print {
  .header-card,
  .compare-card,
  .overview-actions {
    display: none !important;
  }
  
  .overview-card {
    page-break-inside: avoid;
  }
  
  .config-item {
    page-break-inside: avoid;
  }
}
</style>
