/**
 * 包装类型配置文件
 * 定义系统支持的所有包装类型及其属性
 * 
 * Requirements: 9.1, 9.2, 10.1
 */

/**
 * 包装类型配置
 * @type {Object.<string, {key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}>}
 */
const PACKAGING_TYPES = {
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
};

/**
 * 有效的包装类型键列表
 * @type {string[]}
 */
const VALID_PACKAGING_TYPE_KEYS = Object.keys(PACKAGING_TYPES);

/**
 * 验证包装类型是否有效
 * @param {string} type - 包装类型标识
 * @returns {boolean} 是否为有效的包装类型
 */
function isValidPackagingType(type) {
  return type in PACKAGING_TYPES;
}

/**
 * 获取所有包装类型配置
 * @returns {Array<{key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}>}
 */
function getAllPackagingTypes() {
  return Object.values(PACKAGING_TYPES);
}

/**
 * 根据类型标识获取包装类型配置
 * @param {string} type - 包装类型标识
 * @returns {{key: string, name: string, layers: number, labels: string[], fieldLabels: string[]}|null}
 */
function getPackagingTypeByKey(type) {
  return PACKAGING_TYPES[type] || null;
}

/**
 * 获取包装类型的中文名称
 * @param {string} type - 包装类型标识
 * @returns {string} 中文名称，如果类型无效则返回空字符串
 */
function getPackagingTypeName(type) {
  const config = PACKAGING_TYPES[type];
  return config ? config.name : '';
}

/**
 * 格式化包装方式显示文本
 * @param {string} type - 包装类型标识
 * @param {number} layer1 - 第一层数量
 * @param {number} layer2 - 第二层数量
 * @param {number} [layer3] - 第三层数量（可选，2层类型不需要）
 * @returns {string} 格式化后的包装方式文本
 */
function formatPackagingMethod(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type];
  if (!config) return '';
  
  if (config.layers === 2) {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}`;
  } else {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}, ${layer3}${config.labels[2]}`;
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
function calculateTotalPerCarton(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type];
  if (!config) return 0;
  
  if (config.layers === 2) {
    return (layer1 || 0) * (layer2 || 0);
  } else {
    return (layer1 || 0) * (layer2 || 0) * (layer3 || 0);
  }
}

/**
 * 验证配置结构完整性
 * 检查所有包装类型配置是否包含必需字段且格式正确
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateConfigIntegrity() {
  const errors = [];
  const requiredFields = ['key', 'name', 'layers', 'labels', 'fieldLabels'];
  
  for (const [key, config] of Object.entries(PACKAGING_TYPES)) {
    // 检查必需字段
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push(`包装类型 "${key}" 缺少必需字段: ${field}`);
      }
    }
    
    // 检查 key 一致性
    if (config.key !== key) {
      errors.push(`包装类型 "${key}" 的 key 字段值不匹配: ${config.key}`);
    }
    
    // 检查 layers 值
    if (config.layers !== 2 && config.layers !== 3) {
      errors.push(`包装类型 "${key}" 的 layers 值无效: ${config.layers}（应为 2 或 3）`);
    }
    
    // 检查 labels 数组长度
    if (Array.isArray(config.labels) && config.labels.length !== config.layers) {
      errors.push(`包装类型 "${key}" 的 labels 数组长度 (${config.labels.length}) 与 layers (${config.layers}) 不匹配`);
    }
    
    // 检查 fieldLabels 数组长度
    if (Array.isArray(config.fieldLabels) && config.fieldLabels.length !== config.layers) {
      errors.push(`包装类型 "${key}" 的 fieldLabels 数组长度 (${config.fieldLabels.length}) 与 layers (${config.layers}) 不匹配`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  PACKAGING_TYPES,
  VALID_PACKAGING_TYPE_KEYS,
  isValidPackagingType,
  getAllPackagingTypes,
  getPackagingTypeByKey,
  getPackagingTypeName,
  formatPackagingMethod,
  calculateTotalPerCarton,
  validateConfigIntegrity
};
