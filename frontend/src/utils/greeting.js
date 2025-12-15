/**
 * 问候语工具函数
 */

/**
 * 根据当前时间获取问候语
 * @param {number} hour - 小时（0-23），默认使用当前时间
 * @returns {string} 问候语
 */
export function getTimeGreeting(hour = null) {
  if (hour === null) {
    hour = new Date().getHours()
  }

  if (hour >= 6 && hour < 9) {
    return '早上好'
  }
  if (hour >= 9 && hour < 12) {
    return '上午好'
  }
  if (hour >= 13 && hour < 18) {
    return '下午好'
  }
  return '您辛苦了'
}

/**
 * 获取完整的问候语（包含用户名）
 * @param {string} userName - 用户名
 * @param {number} hour - 小时（可选）
 * @returns {string} 完整问候语
 */
export function getFullGreeting(userName, hour = null) {
  const greeting = getTimeGreeting(hour)
  return `${greeting}，${userName || '用户'}`
}
