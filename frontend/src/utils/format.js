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
