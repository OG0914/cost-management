/**
 * 产品类别颜色映射配置
 */

export const CATEGORY_COLORS = {
  '半面罩': '#409EFF',
  '全面罩': '#67C23A',
  '滤盒': '#E6A23C',
  '滤棉': '#F56C6C',
  '配件': '#909399'
}

/**
 * 获取产品类别对应的颜色
 * @param {string} category - 产品类别名称
 * @returns {string} 颜色值
 */
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#909399'
}
