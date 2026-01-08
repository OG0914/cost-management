// 颜色工具函数
const PRESET_COLORS = { 'NIOSH': '#409EFF', 'GB': '#67C23A', 'CE': '#E6A23C', 'ASNZS': '#F56C6C', 'KN': '#9B59B6' }
const COLOR_PALETTE = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#9B59B6', '#3498DB', '#1ABC9C', '#E74C3C', '#9B59B6', '#34495E']

export const getRegulationColor = (name) => { // 预设颜色优先，否则基于名称哈希生成稳定颜色
  if (!name) return '#909399'
  if (PRESET_COLORS[name]) return PRESET_COLORS[name]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLOR_PALETTE[hash % COLOR_PALETTE.length]
}

export const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?'
