/**
 * 审核相关工具函数
 */

/**
 * 状态标签颜色映射
 */
export const statusColorMap = {
  draft: 'info',      // 灰色
  submitted: 'warning', // 黄色
  approved: 'success',  // 绿色
  rejected: 'danger'    // 红色
}

/**
 * 状态中文名称映射
 */
export const statusNameMap = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已退回'
}

/**
 * 获取状态标签类型
 * @param {string} status - 状态值
 * @returns {string} Element Plus tag type
 */
export function getStatusType(status) {
  return statusColorMap[status] || 'info'
}

/**
 * 获取状态中文名称
 * @param {string} status - 状态值
 * @returns {string} 中文名称
 */
export function getStatusName(status) {
  return statusNameMap[status] || status
}

/**
 * 差异高亮颜色规范
 */
export const diffColorMap = {
  unchanged: { bg: '#FFFFFF', border: 'transparent' },
  modified: { bg: '#E6F7FF', border: '#1890FF' },
  added: { bg: '#F6FFED', border: '#52C41A' },
  deleted: { bg: '#FFF1F0', border: '#FF4D4F' }
}

/**
 * 获取差异状态样式
 * @param {string} diffStatus - 差异状态
 * @returns {Object} 样式对象
 */
export function getDiffStyle(diffStatus) {
  const colors = diffColorMap[diffStatus] || diffColorMap.unchanged
  return {
    backgroundColor: colors.bg,
    borderLeft: colors.border !== 'transparent' ? `3px solid ${colors.border}` : 'none'
  }
}

/**
 * 计算明细项差异状态
 * @param {Object} item - 报价单明细项
 * @param {Array} standardItems - 标准配置明细
 * @returns {string} 差异状态: 'unchanged' | 'modified' | 'added' | 'deleted'
 */
export function calculateDiffStatus(item, standardItems) {
  if (!standardItems || standardItems.length === 0) {
    return 'unchanged'
  }

  // 查找对应的标准配置项
  const standardItem = standardItems.find(
    s => s.category === item.category && s.item_name === item.item_name
  )

  if (!standardItem) {
    // 标准配置中不存在，为新增项
    return 'added'
  }

  // 比较用量和单价
  const usageDiff = Math.abs(parseFloat(item.usage_amount) - parseFloat(standardItem.usage_amount))
  const priceDiff = Math.abs(parseFloat(item.unit_price) - parseFloat(standardItem.unit_price))

  if (usageDiff > 0.0001 || priceDiff > 0.0001) {
    return 'modified'
  }

  return 'unchanged'
}

/**
 * 计算利润报价
 * 公式：利润报价 = 最终成本价 / (1 - 利润率)
 * @param {number|string} finalPrice - 最终成本价（内销价或外销保险价）
 * @param {string} salesType - 销售类型 'domestic' | 'export'
 * @returns {Array} 利润报价数组
 */
export function calculateProfitPricing(finalPrice, salesType = 'export') {
  const profitTiers = [0.05, 0.10, 0.25, 0.50]
  const price = parseFloat(finalPrice) || 0
  const currency = salesType === 'export' ? 'USD' : 'CNY'

  return profitTiers.map(rate => ({
    rate: rate * 100,
    price: parseFloat((price / (1 - rate)).toFixed(4)),
    currency
  }))
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式 'full' | 'date' | 'time'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(date, format = 'full') {
  if (!date) return '-'

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}`
    case 'full':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {string} currency - 货币
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的金额
 */
export function formatAmount(amount, currency = 'CNY', decimals = 4) {
  if (amount === null || amount === undefined) return '-'
  return `${parseFloat(amount).toFixed(decimals)} ${currency}`
}

/**
 * 格式化数量（带单位）
 * @param {number} quantity - 数量
 * @param {string} unit - 单位
 * @returns {string} 格式化后的数量
 */
export function formatQuantity(quantity, unit = 'PCS') {
  if (quantity === null || quantity === undefined) return '-'
  return `${quantity.toLocaleString()} ${unit}`
}

/**
 * 销售类型映射
 */
export const salesTypeMap = {
  domestic: '内销',
  export: '外销'
}

/**
 * 获取销售类型中文名称
 * @param {string} type - 销售类型
 * @returns {string} 中文名称
 */
export function getSalesTypeName(type) {
  return salesTypeMap[type] || type
}

/**
 * 审核历史动作映射
 */
export const reviewActionMap = {
  created: '创建',
  submitted: '提交',
  approved: '审核通过',
  rejected: '退回',
  resubmitted: '重新提交'
}

/**
 * 获取审核动作中文名称
 * @param {string} action - 动作
 * @returns {string} 中文名称
 */
export function getReviewActionName(action) {
  return reviewActionMap[action] || action
}
