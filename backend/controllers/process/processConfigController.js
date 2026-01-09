/**
 * 工序配置控制器
 * 处理工序的 CRUD 操作
 */

const logger = require('../../utils/logger');
const ProcessConfig = require('../../models/ProcessConfig');

// 获取工序列表
exports.getProcessConfigs = async (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const processes = await ProcessConfig.findByPackagingConfigId(packagingConfigId);
    res.json({ success: true, data: processes });
  } catch (error) {
    logger.error('获取工序列表失败:', error);
    res.status(500).json({ success: false, message: '获取工序列表失败' });
  }
};

// 创建工序
exports.createProcessConfig = async (req, res) => {
  try {
    const { packaging_config_id, process_name, unit_price, sort_order } = req.body;

    if (!packaging_config_id || !process_name || unit_price === undefined) {
      return res.status(400).json({ success: false, message: '请填写完整的工序信息' });
    }

    const id = await ProcessConfig.create({ packaging_config_id, process_name, unit_price, sort_order });
    res.json({ success: true, data: { id }, message: '工序创建成功' });
  } catch (error) {
    logger.error('创建工序失败:', error);
    res.status(500).json({ success: false, message: '创建工序失败' });
  }
};

// 更新工序
exports.updateProcessConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { process_name, unit_price, sort_order, is_active } = req.body;

    await ProcessConfig.update(id, {
      process_name, unit_price, sort_order,
      is_active: is_active !== undefined ? is_active : true
    });

    res.json({ success: true, message: '工序更新成功' });
  } catch (error) {
    logger.error('更新工序失败:', error);
    res.status(500).json({ success: false, message: '更新工序失败' });
  }
};

// 删除工序
exports.deleteProcessConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await ProcessConfig.delete(id);
    res.json({ success: true, message: '工序删除成功' });
  } catch (error) {
    logger.error('删除工序失败:', error);
    res.status(500).json({ success: false, message: '删除工序失败' });
  }
};
