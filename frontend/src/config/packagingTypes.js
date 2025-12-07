/**
 * 包装类型配置文件
 * 定义系统支持的所有包装类型及其属性
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

/**
 * 包装类型配置
 * @type {Object.<string, {key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}>}
 */
export const PACKAGING_TYPES = {
  standard_box: {
    key: 'standard_box',
    name: '标准彩盒',
    layers: 3,
    labels: ['pc/袋', '袋/盒', '盒/箱'],
    fieldLabels: ['每袋数量（pcs）', '每盒袋数（bags）', '每箱盒数（boxes）']
  },
  no_box: {
    key: 'no_box',
    name: '无彩盒',
    layers: 2,
    labels: ['pc/袋', '袋/箱'],
    fieldLabels: ['每袋数量（pcs）', '每箱袋数（bags）']
  },
  blister_direct: {
    key: 'blister_direct',
    name: '泡壳直装',
    layers: 2,
    labels: ['pc/泡壳', '泡壳/箱'],
    fieldLabels: ['每泡壳数量（pcs）', '每箱泡壳数']
  },
  blister_bag: {
    key: 'blister_bag',
    name: '泡壳袋装',
    layers: 3,
    labels: ['pc/袋', '袋/泡壳', '泡壳/箱'],
    fieldLabels: ['每袋数量（pcs）', '每泡壳袋数（bags）', '每箱泡壳数']
  }
}

/**
 * 有效的包装类型键列表
 * @type {string[]}
 */
export const VALID_PACKAGING_TYPE_KEYS = Object.keys(PACKAGING_TYPES)

/**
 * 获取包装类型列表（用于下拉选择器）
 * @returns {Array<{key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}>}
 */
export function getPackagingTypeList() {
  return Object.values(PACKAGING_TYPES)
}

/**
 * 验证包装类型是否有效
 * @param {string} type - 包装类型标识
 * @returns {boolean} 是否为有效的包装类型
 */
export function isValidPackagingType(type) {
  return type in PACKAGING_TYPES
}

/**
 * 根据类型标识获取包装类型配置
 * @param {string} type - 包装类型标识
 * @returns {{key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}|null}
 */
export function getPackagingTypeByKey(type) {
  return PACKAGING_TYPES[type] || null
}

/**
 * 获取包装类型的中文名称
 * @param {string} type - 包装类型标识
 * @returns {string} 中文名称，如果类型无效则返回空字符串
 */
export function getPackagingTypeName(type) {
  const config = PACKAGING_TYPES[type]
  return config ? config.name : ''
}

/**
 * 格式化包装方式显示文本
 * @param {string} type - 包装类型标识
 * @param {number} layer1 - 第一层数量
 * @param {number} layer2 - 第二层数量
 * @param {number} [layer3] - 第三层数量（可选，2层类型不需要）
 * @returns {string} 格式化后的包装方式文本
 */
export function formatPackagingMethod(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type]
  if (!config) return ''
  
  if (config.layers === 2) {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}`
  } else {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}, ${layer3}${config.labels[2]}`
  }
}

/**
 * 计算每箱总数
 * @param {string} type - 包装类型标识
 * @param {number} layer1 - 第一层数量
 * @param {number} layer2 - 第二层数量
 * @param {number} [layer3] - 第三层数量（可选，2层类型不需要）
 * @returns {number} 每箱总数
 */
export function calculateTotalPerCarton(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type]
  if (!config) return 0
  
  if (config.layers === 2) {
    return (layer1 || 0) * (layer2 || 0)
  } else {
    return (layer1 || 0) * (layer2 || 0) * (layer3 || 0)
  }
}

/**
 * 根据配置对象格式化包装方式（兼容新旧字段名）
 * @param {Object} config - 包装配置对象
 * @returns {string} 格式化后的包装方式文本
 */
export function formatPackagingMethodFromConfig(config) {
  if (!config) return ''
  
  const type = config.packaging_type || 'standard_box'
  const layer1 = config.layer1_qty ?? config.pc_per_bag
  const layer2 = config.layer2_qty ?? config.bags_per_box
  const layer3 = config.layer3_qty ?? config.boxes_per_carton
  
  return formatPackagingMethod(type, layer1, layer2, layer3)
}

/**
 * 根据配置对象计算每箱总数（兼容新旧字段名）
 * @param {Object} config - 包装配置对象
 * @returns {number} 每箱总数
 */
export function calculateTotalFromConfig(config) {
  if (!config) return 0
  
  const type = config.packaging_type || 'standard_box'
  const layer1 = config.layer1_qty ?? config.pc_per_bag
  const layer2 = config.layer2_qty ?? config.bags_per_box
  const layer3 = config.layer3_qty ?? config.boxes_per_carton
  
  return calculateTotalPerCarton(type, layer1, layer2, layer3)
}

/**
 * 获取包装类型的选项列表（用于 Element Plus Select）
 * @returns {Array<{value: string, label: string}>}
 */
export function getPackagingTypeOptions() {
  return Object.values(PACKAGING_TYPES).map(type => ({
    value: type.key,
    label: type.name
  }))
}
