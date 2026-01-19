/**
 * 原料类别匹配工具
 * 从原料名称自动识别归属类别
 */

const SystemConfig = require('../models/SystemConfig');
const logger = require('./logger');

/**
 * 从原料名称识别类别
 * @param {string} materialName - 原料名称
 * @param {Array} categories - 类别列表 [{name, sort}]
 * @returns {string|null} 匹配的类别名称或null
 */
function matchCategory(materialName, categories) {
  if (!materialName || !categories?.length) return null;
  
  // 查找冒号位置（支持中英文冒号）
  let colonIndex = materialName.indexOf('：');
  if (colonIndex === -1) colonIndex = materialName.indexOf(':');
  if (colonIndex === -1) return null;
  
  const prefix = materialName.substring(0, colonIndex).trim();
  if (!prefix) return null;
  
  const matched = categories.find(c => c.name === prefix);
  return matched ? matched.name : null;
}

/**
 * 从数据库获取类别列表并匹配
 * @param {string} materialName - 原料名称
 * @returns {Promise<string|null>} 匹配的类别名称或null
 */
async function matchCategoryFromDB(materialName) {
  try {
    const config = await SystemConfig.findByKey('material_categories');
    if (!config) return null;
    
    const categories = JSON.parse(config.config_value || '[]');
    return matchCategory(materialName, categories);
  } catch (err) {
    logger.error('匹配类别失败:', err);
    return null;
  }
}

module.exports = { matchCategory, matchCategoryFromDB };
