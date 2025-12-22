<template>
  <el-dialog
    :model-value="modelValue"
    :title="`📋 报价单审核   ${quotationDetail?.quotation_no || ''}`"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    destroy-on-close
    append-to-body
  >
    <div v-loading="loading" class="review-detail-content">
      <template v-if="quotationDetail">
        <!-- 基本信息 -->
        <div class="section">
          <div class="section-title">基本信息</div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="label">审核状态:</span>
                <el-tag :type="getStatusType(quotationDetail.status)">
                  {{ getStatusName(quotationDetail.status) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">销售类型:</span>
                <span class="value">{{ getSalesTypeName(quotationDetail.sales_type) }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">客户名称:</span>
                <span class="value">{{ quotationDetail.customer_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">客户地区:</span>
                <span class="value">{{ quotationDetail.customer_region || '-' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">法规类别:</span>
                <span class="value">{{ quotationDetail.regulation_name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">产品型号:</span>
                <span class="value">{{ quotationDetail.model_name }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">包装配置:</span>
                <span class="value">
                  <template v-if="quotationDetail.packaging_config_name">
                    {{ quotationDetail.packaging_config_name }}
                    <span style="color: #909399; font-size: 12px; margin-left: 8px;">
                      {{ formatPackagingSpec(quotationDetail) }}
                    </span>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>
              <div class="info-item">
                <span class="label">订单数量:</span>
                <span class="value">{{ formatQuantity(quotationDetail.quantity) }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">创建人员:</span>
                <span class="value">{{ quotationDetail.creator_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">提交时间:</span>
                <span class="value">{{ formatDateTime(quotationDetail.submitted_at) }}</span>
              </div>
            </div>
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
        </div>

        <!-- 价格汇总 -->
        <div class="section">
          <div class="section-title">价格汇总</div>
          <div class="price-summary">
            <div class="price-row">
              <span>成本价: {{ formatNumber(quotationDetail.base_cost) }} 元</span>
              <span>管销价: {{ formatNumber(quotationDetail.overhead_price) }} 元</span>
              <span>{{ quotationDetail.sales_type === 'export' ? '外销价' : '内销价' }}: {{ formatAmount(quotationDetail.final_price, quotationDetail.currency) }}</span>
            </div>
            <div class="profit-pricing">
              <div class="profit-title">利润报价:</div>
              <div class="profit-items">
                <div v-for="item in profitPricing" :key="item.rate" class="profit-item" :class="{ 'custom-tier': item.isCustom }">
                  {{ item.rate }}%: {{ formatNumber(item.price) }} {{ item.currency }}
                  <span v-if="item.isCustom" class="custom-tag">自定义</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button type="success" @click="handleApprove">✓ 通过</el-button>
        <el-button type="danger" @click="handleReject">✗ 退回</el-button>
      </div>
    </template>

    <!-- 通过确认弹窗 -->
    <ApproveConfirmDialog
      v-model="approveDialogVisible"
      :quotation="quotationDetail"
      :profit-pricing="profitPricing"
      @confirm="confirmApprove"
    />

    <!-- 退回确认弹窗 -->
    <RejectConfirmDialog
      v-model="rejectDialogVisible"
      :quotation="quotationDetail"
      :profit-pricing="profitPricing"
      @confirm="confirmReject"
    />
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
import ApproveConfirmDialog from './ApproveConfirmDialog.vue'
import RejectConfirmDialog from './RejectConfirmDialog.vue'

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
const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)

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
  
  // 系统默认利润区间
  const systemTiers = calculateProfitPricing(
    quotationDetail.value.base_cost,
    0.25,
    7.2,
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
  const map = { unchanged: '✓ 一致', modified: '⚠ 修改', added: '➕ 新增', deleted: '➖ 删除' }
  return map[status] || status
}

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false)
}

const handleApprove = () => {
  approveDialogVisible.value = true
}

const handleReject = () => {
  rejectDialogVisible.value = true
}

const confirmApprove = async (comment) => {
  try {
    await reviewStore.approveQuotation(props.quotationId, comment)
    approveDialogVisible.value = false
    closeDialog()
    emit('approved')
  } catch (error) {
    ElMessage.error('审核通过失败')
  }
}

const confirmReject = async (reason) => {
  try {
    await reviewStore.rejectQuotation(props.quotationId, reason)
    rejectDialogVisible.value = false
    closeDialog()
    emit('rejected')
  } catch (error) {
    ElMessage.error('退回失败')
  }
}
</script>

<style scoped>
.review-detail-content {
  max-height: 70vh;
  overflow-y: auto;
  min-height: 300px;
}

.section {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 40px;
}

.info-item {
  flex: 1;
  display: flex;
  align-items: center;
}

.info-item .label {
  width: 70px;
  color: #909399;
  font-size: 13px;
}

.info-item .value {
  color: #303133;
  font-size: 13px;
}

.cost-tabs {
  margin-top: 8px;
}

.subtotal-row {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.diff-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.diff-unchanged {
  color: #67c23a;
}

.diff-modified {
  color: #1890ff;
  background: #e6f7ff;
}

.diff-added {
  color: #52c41a;
  background: #f6ffed;
}

.diff-deleted {
  color: #ff4d4f;
  background: #fff1f0;
}

.price-summary {
  font-size: 13px;
}

.price-row {
  display: flex;
  gap: 40px;
  margin-bottom: 12px;
}

.profit-pricing {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.profit-title {
  color: #909399;
}

.profit-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profit-item {
  color: #303133;
}

.profit-item.custom-tier {
  color: #E6A23C;
}

.custom-tag {
  font-size: 10px;
  background: #fdf6ec;
  color: #E6A23C;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
