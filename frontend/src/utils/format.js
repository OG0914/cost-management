/**
 * 数字格式化工具函数
 */

/**
 * 格式化数字为千分位显示
 * @param {number|string} value - 要格式化的数字
 * @param {number} decimals - 小数位数，默认4位
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    return ''
  }
  
  // 保留指定小数位
  const fixed = num.toFixed(decimals)
  
  // 分离整数和小数部分
  const parts = fixed.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  // 整数部分添加千分位
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // 组合整数和小数部分
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

/**
 * 解析千分位格式的字符串为数字
 * @param {string} value - 千分位格式的字符串
 * @returns {number} 解析后的数字
 */
export function parseFormattedNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  
  // 移除千分位逗号
  const cleaned = String(value).replace(/,/g, '')
  const num = Number(cleaned)
  
  return isNaN(num) ? null : num
}

/**
 * 下载 Blob 文件
 * @param {Blob|ArrayBuffer} data - 文件数据
 * @param {string} filename - 文件名
 */
export function downloadBlob(data, filename) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 格式化日期时间
 * 支持 ISO 格式 (2025-12-06T16:06:31.000Z) 和普通格式 (2025-12-06 16:06:31)
 * @param {string|Date} value - 日期值
 * @param {string} format - 格式类型: 'datetime' | 'date' | 'time'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(value, format = 'datetime') {
  if (!value) return ''
  
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}:${seconds}`
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
}

/**
 * 格式化时间（相对时间或绝对时间）
 * 用于显示通知等场景，如：刚刚、5分钟前、1小时前、昨天、2024-01-01
 * @param {string|Date} value - 日期值
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(value) {
  if (!value) return ''
  
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  // 刚刚（1分钟内）
  if (diff < minute) {
    return '刚刚'
  }
  
  // 几分钟前
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  }
  
  // 几小时前
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  }
  
  // 昨天
  if (diff < 2 * day) {
    return '昨天'
  }
  
  // 7天内
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  }
  
  // 超过7天显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayStr = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}
