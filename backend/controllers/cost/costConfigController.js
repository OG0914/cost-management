/**
 * 成本配置查询控制器
 * 处理型号标准数据、包装配置、原料系数等查询
 */

const SystemConfig = require('../../models/SystemConfig');
const dbManager = require('../../db/database');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * 获取型号标准数据（工序和包材）
 */
exports.getModelStandardData = async (req, res) => {
  try {
    const { modelId } = req.params;
    logger.debug('获取型号标准数据，modelId:', modelId);

    const processesResult = await dbManager.query(
      `SELECT id, name, price FROM processes WHERE model_id = $1 ORDER BY id`,
      [modelId]
    );
    const processes = processesResult.rows;

    const packagingResult = await dbManager.query(
      `SELECT id, name, usage_amount, price, currency FROM packaging WHERE model_id = $1 ORDER BY id`,
      [modelId]
    );
    const packaging = packagingResult.rows;

    logger.debug(`找到 ${processes.length} 个工序, ${packaging.length} 个包材`);
    res.json(success({ processes, packaging }, '获取型号标准数据成功'));
  } catch (err) {
    logger.error('获取型号标准数据失败:', err);
    res.status(500).json(error('获取型号标准数据失败: ' + err.message, 500));
  }
};

/**
 * 获取所有包装配置列表
 */
exports.getPackagingConfigs = async (req, res) => {
  try {
    const result = await dbManager.query(`
      SELECT 
        pc.id, pc.model_id, pc.config_name, pc.packaging_type,
        pc.layer1_qty, pc.layer2_qty, pc.layer3_qty,
        pc.pc_per_bag, pc.bags_per_box, pc.boxes_per_carton, pc.is_active,
        m.model_name, m.model_category, m.regulation_id,
        r.name as regulation_name
      FROM packaging_configs pc
      JOIN models m ON pc.model_id = m.id
      JOIN regulations r ON m.regulation_id = r.id
      WHERE pc.is_active = true
      ORDER BY m.model_name, pc.config_name
    `);

    logger.debug(`找到 ${result.rows.length} 个包装配置`);
    res.json(success(result.rows, '获取包装配置列表成功'));
  } catch (err) {
    logger.error('获取包装配置列表失败:', err);
    res.status(500).json(error('获取包装配置列表失败: ' + err.message, 500));
  }
};

/**
 * 获取包装配置详情（包含工序和包材）
 */
exports.getPackagingConfigDetails = async (req, res) => {
  try {
    const { configId } = req.params;
    logger.debug('获取包装配置详情，configId:', configId);

    const configResult = await dbManager.query(
      `SELECT pc.*, m.model_name, m.regulation_id, r.name as regulation_name
       FROM packaging_configs pc
       JOIN models m ON pc.model_id = m.id
       JOIN regulations r ON m.regulation_id = r.id
       WHERE pc.id = $1`,
      [configId]
    );
    const config = configResult.rows[0] || null;

    if (!config) return res.status(404).json(error('包装配置不存在', 404));

    const processesResult = await dbManager.query(
      `SELECT id, process_name, unit_price, sort_order
       FROM process_configs
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [configId]
    );

    const materialsResult = await dbManager.query(
      `SELECT id, material_name, basic_usage, unit_price, carton_volume, sort_order
       FROM packaging_materials
       WHERE packaging_config_id = $1 AND is_active = true
       ORDER BY sort_order, id`,
      [configId]
    );

    logger.debug(`找到 ${processesResult.rows.length} 个工序, ${materialsResult.rows.length} 个包材`);
    res.json(success({
      config,
      processes: processesResult.rows,
      materials: materialsResult.rows
    }, '获取包装配置详情成功'));
  } catch (err) {
    logger.error('获取包装配置详情失败:', err);
    res.status(500).json(error('获取包装配置详情失败: ' + err.message, 500));
  }
};

/**
 * 获取原料系数配置
 */
exports.getMaterialCoefficients = async (req, res) => {
  try {
    const coefficients = await SystemConfig.getValue('material_coefficients');
    res.json(success(coefficients || { '口罩': 0.97, '半面罩': 0.99 }));
  } catch (err) {
    logger.error('获取原料系数配置失败:', err);
    res.status(500).json(error('获取原料系数配置失败: ' + err.message, 500));
  }
};
