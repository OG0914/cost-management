/**
 * 系统配置控制器
 */

const SystemConfig = require('../../models/SystemConfig');
const { success, error } = require('../../utils/response');
const { getAllPackagingTypes, PACKAGING_TYPES } = require('../../config/packagingTypes');

/**
 * 获取所有配置
 */
const getAllConfigs = async (req, res, next) => {
  try {
    const configs = await SystemConfig.getAllAsObject();
    res.json(success(configs));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取单个配置
 */
const getConfigByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const config = await SystemConfig.findByKey(key);

    if (!config) {
      return res.status(404).json(error('配置不存在', 404));
    }

    // 解析配置值
    let value;
    try {
      value = JSON.parse(config.config_value);
    } catch (e) {
      value = config.config_value;
    }

    res.json(success({
      key: config.config_key,
      value: value,
      description: config.description,
      updated_at: config.updated_at
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * 更新单个配置
 */
const updateConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json(error('配置值不能为空', 400));
    }

    // 验证配置键是否存在
    const existingConfig = await SystemConfig.findByKey(key);
    if (!existingConfig) {
      return res.status(404).json(error('配置不存在', 404));
    }

    // 验证配置值
    const validationError = validateConfigValue(key, value);
    if (validationError) {
      return res.status(400).json(error(validationError, 400));
    }

    // 更新配置
    const updated = await SystemConfig.update(key, value);

    if (!updated) {
      return res.status(500).json(error('配置更新失败', 500));
    }

    res.json(success(null, '配置更新成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 批量更新配置
 */
const batchUpdateConfigs = async (req, res, next) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json(error('配置数据格式错误', 400));
    }

    // 验证所有配置值
    for (const [key, value] of Object.entries(configs)) {
      const validationError = validateConfigValue(key, value);
      if (validationError) {
        return res.status(400).json(error(`${key}: ${validationError}`, 400));
      }
    }

    // 批量更新
    const updatedCount = await SystemConfig.batchUpdate(configs);

    res.json(success({ updatedCount }, `成功更新 ${updatedCount} 个配置`));
  } catch (err) {
    next(err);
  }
};

/**
 * 创建新配置
 */
const createConfig = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined || value === null) {
      return res.status(400).json(error('配置键和值不能为空', 400));
    }

    // 检查配置键是否已存在
    const existingConfig = await SystemConfig.findByKey(key);
    if (existingConfig) {
      return res.status(400).json(error('配置键已存在', 400));
    }

    // 创建配置
    const configId = await SystemConfig.create({ key, value, description });

    res.status(201).json(success({ id: configId }, '配置创建成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 删除配置
 */
const deleteConfig = async (req, res, next) => {
  try {
    const { key } = req.params;

    // 防止删除核心配置
    const protectedKeys = ['overhead_rate', 'vat_rate', 'insurance_rate', 'exchange_rate', 'process_coefficient', 'profit_tiers'];
    if (protectedKeys.includes(key)) {
      return res.status(400).json(error('不能删除核心配置项', 400));
    }

    const deleted = await SystemConfig.delete(key);

    if (!deleted) {
      return res.status(404).json(error('配置不存在', 404));
    }

    res.json(success(null, '配置删除成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取计算器配置
 */
const getCalculatorConfig = async (req, res, next) => {
  try {
    const config = await SystemConfig.getCalculatorConfig();
    res.json(success(config));
  } catch (err) {
    next(err);
  }
};

/**
 * 验证配置值
 * @param {string} key - 配置键
 * @param {any} value - 配置值
 * @returns {string|null} 错误信息，如果验证通过返回 null
 */
function validateConfigValue(key, value) {
  switch (key) {
    case 'overhead_rate':
    case 'vat_rate':
    case 'insurance_rate':
      // 验证费率：0 到 1 之间的小数
      const rate = parseFloat(value);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        return '费率必须是 0 到 1 之间的数值';
      }
      break;

    case 'process_coefficient':
      // 验证工价系数：正数
      const coefficient = parseFloat(value);
      if (isNaN(coefficient) || coefficient <= 0) {
        return '工价系数必须是正数';
      }
      break;

    case 'exchange_rate':
      // 验证汇率：正数
      const exchangeRate = parseFloat(value);
      if (isNaN(exchangeRate) || exchangeRate <= 0) {
        return '汇率必须是正数';
      }
      break;

    case 'profit_tiers':
      // 验证利润区间：数组，每个元素是 0 到 1 之间的数值
      if (!Array.isArray(value)) {
        return '利润区间必须是数组';
      }
      for (const tier of value) {
        const tierValue = parseFloat(tier);
        if (isNaN(tierValue) || tierValue < 0) {
          return '利润区间的每个值必须是非负数';
        }
      }
      break;

    default:
      // 其他配置不做特殊验证
      break;
  }

  return null;
}

/**
 * 获取包装类型列表
 * GET /api/config/packaging-types
 * Requirements: 10.4
 */
const getPackagingTypes = async (req, res, next) => {
  try {
    const types = getAllPackagingTypes();
    res.json(success(types));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConfigs,
  getConfigByKey,
  updateConfig,
  batchUpdateConfigs,
  createConfig,
  deleteConfig,
  getCalculatorConfig,
  getPackagingTypes
};
