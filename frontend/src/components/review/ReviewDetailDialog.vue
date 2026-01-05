<template>
  <el-dialog
    :model-value="modelValue"
    title="报价单审核"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    destroy-on-close
    append-to-body
  >
    <div v-loading="loading" class="review-detail-content">
      <template v-if="quotationDetail">
        <!-- 顶部核心标题 -->
        <div class="dashboard-header simple">
           <div class="title-row">
              <span class="quotation-no">{{ quotationDetail.quotation_no }}</span>
              <el-tag :type="getStatusType(quotationDetail.status)" effect="dark" class="status-tag">
                {{ getStatusName(quotationDetail.status) }}
              </el-tag>
              <div class="sales-type-badge" :class="quotationDetail.sales_type">
                {{ getSalesTypeName(quotationDetail.sales_type) }}
              </div>
           </div>
        </div>

        <!-- 详细信息网格 (2x4) -->
        <div class="info-dashboard-grid">
           <!-- Row 1 -->
           <div class="grid-card">
              <div class="card-label">客户名称</div>
              <div class="card-value">{{ quotationDetail.customer_name }}</div>
           </div>
           <div class="grid-card">
              <div class="card-label">客户地区</div>
              <div class="card-value">{{ quotationDetail.customer_region || '-' }}</div>
           </div>
           <div class="grid-card">
              <div class="card-label">法规类别</div>
              <div class="card-value">{{ quotationDetail.regulation_name || '-' }}</div>
           </div>
           <div class="grid-card">
              <div class="card-label">产品数量</div>
              <div class="card-value">{{ formatQuantity(quotationDetail.quantity) }}</div>
           </div>

           <!-- Row 2 -->
           <div class="grid-card">
              <div class="card-label">产品型号</div>
              <div class="card-value">{{ quotationDetail.model_name }}</div>
           </div>
            <div class="grid-card">
               <div class="card-label">包装配置</div>
               <div class="card-value">
                  <div class="text-ellipsis" :title="quotationDetail.packaging_config_name">
                     {{ quotationDetail.packaging_config_name || '-' }}
                  </div>
                  <div class="sub-text text-ellipsis" :title="formatPackagingSpec(quotationDetail)">
                     {{ formatPackagingSpec(quotationDetail) }}
                  </div>
               </div>
            </div>
           <div class="grid-card">
              <div class="card-label">创建人</div>
              <div class="card-value">{{ quotationDetail.creator_name }}</div>
           </div>
           <div class="grid-card">
              <div class="card-label">提交时间</div>
              <div class="card-value">{{ formatDateTime(quotationDetail.submitted_at).split(' ')[0] }}</div>
           </div>
        </div>

        <!-- 成本明细 -->
        <div class="section">
          <div class="section-title">成本明细（完整视图，含差异对比）</div>
          <el-tabs v-model="activeTab" class="cost-tabs">
            <el-tab-pane label="原料" name="material">
              <el-table :data="materialItems" border size="small">
                <el-table-column prop="item_name" label="原料名称" min-width="140" />
                <el-table-column prop="usage_amount" label="用量" width="100">
                  <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                </el-table-column>
                <el-table-column prop="unit_price" label="单价" width="100">
                  <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                </el-table-column>
                <el-table-column prop="subtotal" label="小计" width="100">
                  <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                </el-table-column>
                <el-table-column label="标准值" width="100">
                  <template #default="{ row }">
                    {{ getStandardValue(row, 'material') }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span :class="['diff-status', `diff-${getDiffStatus(row, 'material')}`]">
                      {{ getDiffStatusText(row, 'material') }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="subtotal-row">
                原料小计: {{ formatNumber(materialSubtotal) }} 元 &nbsp;&nbsp;
                标准小计: {{ formatNumber(materialStandardSubtotal) }} 元 &nbsp;&nbsp;
                差异: {{ (materialSubtotal - materialStandardSubtotal) >= 0 ? '+' : '' }}{{ formatNumber(materialSubtotal - materialStandardSubtotal) }} 元
              </div>
            </el-tab-pane>
            <el-tab-pane label="工序" name="process">
              <el-table :data="processItems" border size="small">
                <el-table-column prop="item_name" label="工序名称" min-width="140" />
                <el-table-column prop="usage_amount" label="用量" width="100">
                  <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                </el-table-column>
                <el-table-column prop="unit_price" label="单价" width="100">
                  <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                </el-table-column>
                <el-table-column prop="subtotal" label="小计" width="100">
                  <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                </el-table-column>
                <el-table-column label="标准值" width="100">
                  <template #default="{ row }">{{ getStandardValue(row, 'process') }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span :class="['diff-status', `diff-${getDiffStatus(row, 'process')}`]">
                      {{ getDiffStatusText(row, 'process') }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="subtotal-row">
                工序小计: {{ formatNumber(processSubtotal) }} 元 &nbsp;&nbsp;
                标准小计: {{ formatNumber(processStandardSubtotal) }} 元 &nbsp;&nbsp;
                差异: {{ (processSubtotal - processStandardSubtotal) >= 0 ? '+' : '' }}{{ formatNumber(processSubtotal - processStandardSubtotal) }} 元
              </div>
            </el-tab-pane>
            <el-tab-pane label="包材" name="packaging">
              <el-table :data="packagingItems" border size="small">
                <el-table-column prop="item_name" label="包材名称" min-width="140" />
                <el-table-column prop="usage_amount" label="用量" width="100">
                  <template #default="{ row }">{{ formatNumber(row.usage_amount) }}</template>
                </el-table-column>
                <el-table-column prop="unit_price" label="单价" width="100">
                  <template #default="{ row }">{{ formatNumber(row.unit_price, 2) }}</template>
                </el-table-column>
                <el-table-column prop="subtotal" label="小计" width="100">
                  <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                </el-table-column>
                <el-table-column label="标准值" width="100">
                  <template #default="{ row }">{{ getStandardValue(row, 'packaging') }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span :class="['diff-status', `diff-${getDiffStatus(row, 'packaging')}`]">
                      {{ getDiffStatusText(row, 'packaging') }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="subtotal-row">
                包材小计: {{ formatNumber(packagingSubtotal) }} 元 &nbsp;&nbsp;
                标准小计: {{ formatNumber(packagingStandardSubtotal) }} 元 &nbsp;&nbsp;
                差异: {{ (packagingSubtotal - packagingStandardSubtotal) >= 0 ? '+' : '' }}{{ formatNumber(packagingSubtotal - packagingStandardSubtotal) }} 元
              </div>
            </el-tab-pane>
          </el-tabs>
          
          <!-- 运费信息 (3卡片布局) -->
          <div class="freight-dashboard-grid" v-if="quotationDetail.freight_total || quotationDetail.freight_per_unit">
            <!-- Card 1: 费用概览 -->
            <div class="freight-card">
               <div class="fc-label">运费概览</div>
               <div class="fc-row">
                 <span>总运费:</span> <span class="fw-500">¥{{ formatNumber(quotationDetail.freight_total || 0, 2) }}</span>
               </div>
               <div class="fc-row mt-4">
                 <span>每片分摊:</span> <span class="fw-500">{{ formatNumber(quotationDetail.freight_per_unit || 0) }} 元</span>
               </div>
            </div>

            <!-- Card 2: 成本归属 -->
            <div class="freight-card">
               <div class="fc-label">运费是否计入成本</div>
               <div class="fc-value-large">
                  <span :class="quotationDetail.include_freight_in_base ? 'text-blue' : 'text-gray'">
                     {{ quotationDetail.include_freight_in_base ? '是' : '否' }}
                  </span>
               </div>
            </div>

            <!-- Card 3: 物流配置 (仅外销显示) -->
            <div class="freight-card" v-if="quotationDetail.sales_type === 'export'">
               <div class="fc-label">物流配置</div>
               <div class="fc-row">
                 <span>方式:</span> {{ getShippingMethodName(quotationDetail.shipping_method) }}
               </div>
               <div class="fc-row mt-4" v-if="quotationDetail.port">
                 <span>港口:</span> {{ quotationDetail.port }}
               </div>
            </div>
          </div>
        </div>

        <!-- 价格汇总 -->
        <!-- 财务与利润区域 (Card Dashboard) -->
        <div class="financial-section-rows">
          <!-- Row 1: Cost + Price -->
          <div class="fin-row-top">
            <!-- Cost Card -->
            <div class="fin-card cost-card compact">
               <div class="fin-title">成本数据</div>
               <div class="cost-item">
                  <span class="c-label">基础成本</span>
                  <span class="c-value">{{ formatNumber(quotationDetail.base_cost) }}</span>
               </div>
               <div class="cost-item">
                  <span class="c-label">管销费用</span>
                  <span class="c-value">{{ formatNumber(quotationDetail.overhead_price) }}</span>
               </div>
            </div>

            <!-- Price Card -->
            <div class="fin-card price-card compact">
                 <div class="fin-title">{{ quotationDetail.sales_type === 'export' ? '外销最终价' : '内销最终价' }}</div>
                 <div class="price-main-display">
                    <span class="currency">{{ quotationDetail.currency }}</span>
                    <span class="amount">{{ formatNumber(quotationDetail.final_price) }}</span>
                 </div>
            </div>
          </div>

          <!-- Row 2: Profit Independent -->
          <div class="fin-row-bottom">
            <div class="fin-card profit-independent-card">
                <div class="fin-title">利润区间</div>
                <div class="profit-scroll-view">
                    <div 
                      v-for="item in profitPricing" 
                      :key="item.rate" 
                      class="profit-simple-pill"
                    >
                      <span class="pp-rate">{{ item.rate }}%</span>
                      <span class="pp-val">{{ formatNumber(item.price) }}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 静态审核意见区 (固定在底部) -->
    <div class="static-feedback-section" v-if="quotationDetail">
       <div class="fb-header">
         <el-icon><EditPen /></el-icon> 审核意见
         <span class="fb-hint">（通过时选填，退回时必填）</span>
       </div>
       <el-input 
          v-model="reviewComment" 
          type="textarea" 
          :rows="2"
          placeholder="请输入审核批注或退回原因..."
          class="fb-input"
          resize="none"
       />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button type="danger" @click="handleReject" :loading="submitting">退回报价</el-button>
        <el-button type="success" @click="handleApprove" :loading="submitting">此时通过</el-button>
      </div>
    </template>

    <!-- 弹窗已移除，改为内嵌交互 -->
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useReviewStore } from '@/store/review'
import request from '@/utils/request'
import {
  getStatusType,
  getStatusName,
  getSalesTypeName,
  formatDateTime,
  formatAmount,
  formatQuantity,
  calculateProfitPricing
} from '@/utils/review'


import { User, Location, Goods, EditPen } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  quotationId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'approved', 'rejected'])

const reviewStore = useReviewStore()

const loading = ref(false)
const activeTab = ref('material')

// removed reviewMode
const reviewComment = ref('')
const submitting = ref(false)

// 数据
const quotationDetail = ref(null)
const items = ref([])
const standardItems = ref([])
const customProfitTiers = ref([])

// 监听 modelValue 变化，打开时加载数据
watch(() => props.modelValue, (val) => {
  if (val && props.quotationId) {
    loadDetail()
  }
  // 关闭时清空数据
  if (!val) {
    quotationDetail.value = null
    items.value = []
    standardItems.value = []
    customProfitTiers.value = []
    activeTab.value = 'material'
    reviewComment.value = ''
  }
}, { immediate: true })

// 处理弹窗关闭前的回调
const handleBeforeClose = (done) => {
  emit('update:modelValue', false)
  done()
}

// 计算属性 - 按类别分组的明细
const materialItems = computed(() => items.value.filter(i => i.category === 'material'))
const processItems = computed(() => items.value.filter(i => i.category === 'process'))
const packagingItems = computed(() => items.value.filter(i => i.category === 'packaging'))

// 计算小计（处理字符串类型的数值）
const materialSubtotal = computed(() => materialItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))
const processSubtotal = computed(() => processItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))
const packagingSubtotal = computed(() => packagingItems.value.reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0))

// 标准小计
const materialStandardSubtotal = computed(() => {
  return standardItems.value.filter(i => i.category === 'material').reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0)
})
const processStandardSubtotal = computed(() => {
  return standardItems.value.filter(i => i.category === 'process').reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0)
})
const packagingStandardSubtotal = computed(() => {
  return standardItems.value.filter(i => i.category === 'packaging').reduce((sum, i) => sum + (parseFloat(i.subtotal) || 0), 0)
})

// 利润报价 - 合并系统默认和自定义利润区间
const profitPricing = computed(() => {
  if (!quotationDetail.value) return []
  
  // 系统默认利润区间（使用最终成本价计算）
  const systemTiers = calculateProfitPricing(
    quotationDetail.value.final_price,
    quotationDetail.value.sales_type
  ).map(tier => ({ ...tier, isCustom: false }))
  
  // 自定义利润区间
  const customTiers = customProfitTiers.value.map(tier => ({
    rate: tier.profitRate * 100,
    price: parseFloat(tier.price),
    currency: quotationDetail.value.sales_type === 'export' ? 'USD' : 'CNY',
    isCustom: true
  }))
  
  // 合并并按利润率排序
  const allTiers = [...systemTiers, ...customTiers]
  allTiers.sort((a, b) => a.rate - b.rate)
  
  return allTiers
})

// 加载详情
const loadDetail = async () => {
  if (!props.quotationId) {
    console.error('quotationId is required')
    return
  }
  
  loading.value = true
  try {
    // 直接调用 API 而不是通过 store，避免 store 状态问题
    const response = await request.get(`/review/${props.quotationId}/detail`)
    console.log('审核详情API响应:', response)
    
    if (response.success) {
      quotationDetail.value = response.data.quotation
      items.value = response.data.items || []
      standardItems.value = response.data.standardItems || []
      console.log('加载的明细数据:', items.value)
      
      // 解析自定义利润区间
      if (quotationDetail.value.custom_profit_tiers) {
        try {
          customProfitTiers.value = JSON.parse(quotationDetail.value.custom_profit_tiers)
        } catch (e) {
          console.error('解析自定义利润档位失败:', e)
          customProfitTiers.value = []
        }
      } else {
        customProfitTiers.value = []
      }
    } else {
      ElMessage.error(response.message || '加载详情失败')
    }
  } catch (error) {
    console.error('加载审核详情失败:', error)
    ElMessage.error('加载详情失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 格式化数字（处理字符串类型的数值）
const formatNumber = (value, decimals = 4) => {
  if (value === null || value === undefined) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return num.toFixed(decimals)
}

// 格式化包装规格显示（根据二层或三层）
const formatPackagingSpec = (row) => {
  if (!row.packaging_type) return ''
  // 二层包装类型：no_box, blister_direct
  if (row.packaging_type === 'no_box') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/箱`
  } else if (row.packaging_type === 'blister_direct') {
    return `${row.layer1_qty}pc/泡壳, ${row.layer2_qty}泡壳/箱`
  } else if (row.packaging_type === 'blister_bag') {
    return `${row.layer1_qty}pc/袋, ${row.layer2_qty}袋/泡壳, ${row.layer3_qty}泡壳/箱`
  }
  // 默认三层：standard_box
  return `${row.layer1_qty}片/袋, ${row.layer2_qty}袋/盒, ${row.layer3_qty}盒/箱`
}

// 获取标准值
const getStandardValue = (item, category) => {
  const std = standardItems.value.find(s => s.category === category && s.item_name === item.item_name)
  return std ? formatNumber(std.subtotal) : '-'
}

// 获取差异状态
const getDiffStatus = (item, category) => {
  const std = standardItems.value.find(s => s.category === category && s.item_name === item.item_name)
  if (!std) return 'added'
  const diff = Math.abs(parseFloat(item.subtotal || 0) - parseFloat(std.subtotal || 0))
  return diff > 0.0001 ? 'modified' : 'unchanged'
}

const getDiffStatusText = (item, category) => {
  const status = getDiffStatus(item, category)
  const map = { unchanged: '✓ 一致', modified: '⚠ 修改', added: '+ 新增', deleted: '- 删除' }
  return map[status] || status
}

// 获取运输方式中文名称
const getShippingMethodName = (method) => {
  const map = { fcl_40: '40GP 大柜', fcl_20: '20GP 小柜', lcl: 'LCL 散货' }
  return map[method] || method || '-'
}

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false)
  reviewComment.value = ''
}

// 提交审核：通过
const handleApprove = async () => {
  submitting.value = true
  try {
    await reviewStore.approveQuotation(props.quotationId, reviewComment.value)
    ElMessage.success('审核通过成功')
    emit('approved')
    closeDialog()
  } catch (error) {
    ElMessage.error('审核通过失败')
  } finally {
    submitting.value = false
  }
}

// 提交审核：退回
const handleReject = async () => {
  if (!reviewComment.value.trim()) {
    ElMessage.warning('请在下方填写退回原因')
    // 聚焦输入框 (简单的做法，或者ref)
    const input = document.querySelector('.fb-input textarea')
    if(input) input.focus()
    return
  }

  submitting.value = true
  try {
    await reviewStore.rejectQuotation(props.quotationId, reviewComment.value)
    ElMessage.success('退回成功')
    emit('rejected')
    closeDialog()
  } catch (error) {
    ElMessage.error('退回失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 顶部仪表盘样式 */
.review-detail-content {
  max-height: 55vh; /* 调整高度，留出更多空间给底部 */
  overflow-y: auto;
  padding-bottom: 20px;
}

.dashboard-header {
  background: #ffffff;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 20px;
  display: flex;
  align-items: center; /* Center vertically */
  /* justify-content removed if redundant or keep space-between if needed? */
}
.dashboard-header.simple .title-row {
  margin-bottom: 0;
} 
/* Removed .header-main, .meta-row etc since they are gone */

.header-main {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.quotation-no {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.status-tag {
  font-weight: 600;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.highlight-qty {
  color: #1a1a1a;
  font-weight: 500;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.sales-type-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sales-type-badge.domestic { background: #e6f7ff; color: #1890ff; }
.sales-type-badge.export { background: #fff7e6; color: #fa8c16; }

/* 网格布局 */
.info-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.grid-card {
  background: #fcfcfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
}

.grid-card:hover {
  border-color: #dcdfe6;
  transform: translateY(-1px);
}
/* Removed full-width */
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.sub-text {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-top: 2px;
}

.card-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sub-value {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
}

/* 成本区域去噪 */
.section {
  background: transparent;
  padding: 0;
  margin-bottom: 24px;
}
.section-title {
  border-bottom: none;
  font-size: 15px;
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.cost-tabs {
  margin-top: 0;
}

.subtotal-row {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f9fafc;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #ebeef5;
}

/* 差异高亮 */
.diff-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.diff-unchanged { color: #67c23a; }
.diff-modified { color: #1890ff; background: #e6f7ff; }
.diff-added { color: #52c41a; background: #f6ffed; }
.diff-deleted { color: #ff4d4f; background: #fff1f0; }

/* 运费 */
.freight-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Rigid 3 cols */
  gap: 16px;
  margin-top: 16px;
}
.freight-card {
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
}
/* Enhanced Titles as requested */
.fc-label, .fin-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.fc-row {
  font-size: 13px;
  color: #606266;
  display: flex;
  justify-content: space-between;
}
.fc-row.mt-4 { margin-top: 8px; }

/* Financial Layout Rows */
.financial-section-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.fin-row-top {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Equal width */
  gap: 16px;
}
/* Row bottom is just grouping div */

.fin-card {
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px 20px;
}

/* Cost Card & Price Card Compact */
.cost-card.compact, .price-card.compact {
  height: auto; /* Let content dictate height */
  background: #fdfdfd;
}
.price-card.compact {
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.price-card.compact .fin-title {
   margin-bottom: 8px; /* Tighter */
   color: #409eff;
}

.cost-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
.cost-item:last-child { margin-bottom: 0; }
.c-label { font-size: 13px; color: #606266; }
.c-value { font-size: 14px; font-weight: 500; color: #303133; }

/* Profit Full Width */
.profit-independent-card {
  background: #fdfdfd;
}
.profit-scroll-view {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  align-items: center;
  padding-bottom: 4px;
}
.profit-simple-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  background: #ffffff;
  border-radius: 4px;
  padding: 6px 14px;
  min-width: 64px;
}
.pp-rate { font-size: 12px; color: #909399; margin-bottom: 4px; }
.pp-val { font-size: 13px; font-weight: 600; color: #606266; }

.price-main-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.price-main-display .currency { font-size: 16px; color: #606266; margin-right: 4px; }
.price-main-display .amount { font-size: 28px; font-weight: 700; color: #409eff; line-height: 1; }

/* 静态反馈区 */
.static-feedback-section {
  padding: 20px 24px;
  border-top: 1px solid #ebeef5;
  background: #fcfcfc;
}

.fb-header {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fb-hint {
  font-weight: normal;
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: center; /* Centered buttons */
  gap: 24px; /* Wider gap for centered buttons */
  padding: 0 24px 20px 24px;
  background: #fcfcfc;
  border-radius: 0 0 8px 8px;
}

/* 覆盖表格样式 */
:deep(.el-table) {
  --el-table-header-bg-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

/* 运费卡片 (如果还在用) */
.freight-info-card {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9eb 0%, #f9fafc 100%); /* Greenish tint for logistics? Or blue */
  background: #f8fbff;
  border: 1px solid #dcecfd;
  border-radius: 8px;
}
.freight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}
.freight-content {
  display: flex;
  gap: 24px;
  font-size: 13px;
}
.freight-item { display: flex; align-items: center; gap: 6px; }
.freight-label { color: #909399; }
.freight-value { color: #303133; font-weight: 500; }
.freight-value { color: #303133; font-weight: 500; }

/* 差异对比状态 - 统一风格 (无背景，仅文字颜色) */
.diff-status {
  font-weight: 500;
  padding: 0;
  background: none !important;
  border: none !important; /* Explicitly remove any borders */
  border-radius: 0;
}
.diff-unchanged { color: #67c23a; }
.diff-modified { color: #e6a23c; }
.diff-added { color: #409eff; }
.diff-deleted { color: #f56c6c; }
</style>
```
