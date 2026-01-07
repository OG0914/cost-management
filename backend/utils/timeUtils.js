/**
 * 时间工具函数
 * 所有时间统一使用北京时间 (UTC+8)
 */

/**
 * 获取当前北京时间格式化字符串
 * @param {string} format - 格式类型: 'datetime' | 'date' | 'time'
 * @returns {string} 格式化后的时间字符串
 */
function formatBeijingTime(format = 'datetime') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'date':
            return `${year}-${month}-${day}`;
        case 'time':
            return `${hours}:${minutes}:${seconds}`;
        case 'datetime':
        default:
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * 将日期对象转换为北京时间字符串
 * @param {Date} date - 日期对象
 * @param {string} format - 格式类型: 'datetime' | 'date' | 'time'
 * @returns {string} 格式化后的时间字符串
 */
function toBeijingTimeString(date, format = 'datetime') {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'date':
            return `${year}-${month}-${day}`;
        case 'time':
            return `${hours}:${minutes}:${seconds}`;
        case 'datetime':
        default:
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * 获取今天的日期范围（北京时间）
 * @returns {{ start: string, end: string }} 开始和结束日期
 */
function getTodayRange() {
    const today = formatBeijingTime('date');
    return { start: today, end: today };
}

/**
 * 获取本月的日期范围（北京时间）
 * @returns {{ start: string, end: string }} 开始和结束日期
 */
function getMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // 下个月第0天 = 本月最后一天

    return {
        start: toBeijingTimeString(startDate, 'date'),
        end: toBeijingTimeString(endDate, 'date')
    };
}

module.exports = {
    formatBeijingTime,
    toBeijingTimeString,
    getTodayRange,
    getMonthRange
};
