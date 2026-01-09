/**
 * 包材控制器
 * 处理包材的 CRUD 操作
 */

const logger = require('../../utils/logger');
const PackagingMaterial = require('../../models/PackagingMaterial');

// 获取包材列表
exports.getPackagingMaterials = async (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const materials = await PackagingMaterial.findByPackagingConfigId(packagingConfigId);
    res.json({ success: true, data: materials });
  } catch (error) {
    logger.error('获取包材列表失败:', error);
    res.status(500).json({ success: false, message: '获取包材列表失败' });
  }
};

// 创建包材
exports.createPackagingMaterial = async (req, res) => {
  try {
    const { packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order } = req.body;

    if (!packaging_config_id || !material_name || basic_usage === undefined || unit_price === undefined) {
      return res.status(400).json({ success: false, message: '请填写完整的包材信息' });
    }

    const id = await PackagingMaterial.create({
      packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order
    });

    res.json({ success: true, data: { id }, message: '包材创建成功' });
  } catch (error) {
    logger.error('创建包材失败:', error);
    res.status(500).json({ success: false, message: '创建包材失败' });
  }
};

// 更新包材
exports.updatePackagingMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { material_name, basic_usage, unit_price, carton_volume, sort_order, is_active } = req.body;

    await PackagingMaterial.update(id, {
      material_name, basic_usage, unit_price, carton_volume, sort_order,
      is_active: is_active !== undefined ? is_active : true
    });

    res.json({ success: true, message: '包材更新成功' });
  } catch (error) {
    logger.error('更新包材失败:', error);
    res.status(500).json({ success: false, message: '更新包材失败' });
  }
};

// 删除包材
exports.deletePackagingMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await PackagingMaterial.delete(id);
    res.json({ success: true, message: '包材删除成功' });
  } catch (error) {
    logger.error('删除包材失败:', error);
    res.status(500).json({ success: false, message: '删除包材失败' });
  }
};
