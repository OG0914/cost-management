/**
 * 工序管理控制器
 */

const PackagingConfig = require('../models/PackagingConfig');
const ProcessConfig = require('../models/ProcessConfig');
const PackagingMaterial = require('../models/PackagingMaterial');

// 获取所有包装配置
exports.getAllPackagingConfigs = (req, res) => {
  try {
    const configs = PackagingConfig.findAll();
    
    // 为每个配置计算工序总价和包材总价
    const configsWithPrice = configs.map(config => {
      const processes = ProcessConfig.findByPackagingConfigId(config.id);
      const processSum = processes.reduce((sum, p) => sum + p.unit_price, 0);
      const processTotalPrice = processSum * 1.56;
      
      const materials = PackagingMaterial.findByPackagingConfigId(config.id);
      // 包材总价 = Σ(单价 ÷ 基本用量)
      const materialTotalPrice = materials.reduce((sum, m) => {
        return sum + (m.basic_usage !== 0 ? m.unit_price / m.basic_usage : 0);
      }, 0);
      
      return {
        ...config,
        process_total_price: processTotalPrice,
        material_total_price: materialTotalPrice
      };
    });
    
    res.json({
      success: true,
      data: configsWithPrice
    });
  } catch (error) {
    console.error('获取包装配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取包装配置失败'
    });
  }
};

// 根据型号获取包装配置
exports.getPackagingConfigsByModel = (req, res) => {
  try {
    const { modelId } = req.params;
    const configs = PackagingConfig.findByModelId(modelId);
    
    // 为每个配置计算工序总价和包材总价
    const configsWithPrice = configs.map(config => {
      const processes = ProcessConfig.findByPackagingConfigId(config.id);
      const processSum = processes.reduce((sum, p) => sum + p.unit_price, 0);
      const processTotalPrice = processSum * 1.56;
      
      const materials = PackagingMaterial.findByPackagingConfigId(config.id);
      // 包材总价 = Σ(单价 ÷ 基本用量)
      const materialTotalPrice = materials.reduce((sum, m) => {
        return sum + (m.basic_usage !== 0 ? m.unit_price / m.basic_usage : 0);
      }, 0);
      
      return {
        ...config,
        process_total_price: processTotalPrice,
        material_total_price: materialTotalPrice
      };
    });
    
    res.json({
      success: true,
      data: configsWithPrice
    });
  } catch (error) {
    console.error('获取包装配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取包装配置失败'
    });
  }
};

// 获取包装配置详情（含工序列表）
exports.getPackagingConfigDetail = (req, res) => {
  try {
    const { id } = req.params;
    const config = PackagingConfig.findWithProcesses(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '包装配置不存在'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取包装配置详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取包装配置详情失败'
    });
  }
};

// 获取包装配置完整详情（含工序和包材列表）
exports.getPackagingConfigFullDetail = (req, res) => {
  try {
    const { id } = req.params;
    const config = PackagingConfig.findWithDetails(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '包装配置不存在'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取包装配置完整详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取包装配置完整详情失败'
    });
  }
};

// 创建包装配置
exports.createPackagingConfig = (req, res) => {
  try {
    const { model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton, processes, materials } = req.body;

    // 验证必填字段
    if (!model_id || !config_name || !pc_per_bag || !bags_per_box || !boxes_per_carton) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的包装配置信息'
      });
    }

    // 创建包装配置
    const configId = PackagingConfig.create({
      model_id,
      config_name,
      pc_per_bag,
      bags_per_box,
      boxes_per_carton
    });

    // 如果有工序列表，批量创建
    if (processes && processes.length > 0) {
      ProcessConfig.createBatch(configId, processes);
    }

    // 如果有包材列表，批量创建
    if (materials && materials.length > 0) {
      PackagingMaterial.createBatch(configId, materials);
    }

    res.json({
      success: true,
      data: { id: configId },
      message: '包装配置创建成功'
    });
  } catch (error) {
    console.error('创建包装配置失败:', error);
    
    // 检查是否是唯一性约束错误
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: '该型号下已存在同名的配置，请修改配置名称'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '创建包装配置失败'
    });
  }
};

// 更新包装配置
exports.updatePackagingConfig = (req, res) => {
  try {
    const { id } = req.params;
    const { config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active, processes, materials } = req.body;

    // 更新包装配置
    PackagingConfig.update(id, {
      config_name,
      pc_per_bag,
      bags_per_box,
      boxes_per_carton,
      is_active: is_active !== undefined ? is_active : 1
    });

    // 如果提供了工序列表，先删除旧的，再创建新的
    if (processes) {
      ProcessConfig.deleteByPackagingConfigId(id);
      if (processes.length > 0) {
        ProcessConfig.createBatch(id, processes);
      }
    }

    // 如果提供了包材列表，先删除旧的，再创建新的
    if (materials) {
      PackagingMaterial.deleteByPackagingConfigId(id);
      if (materials.length > 0) {
        PackagingMaterial.createBatch(id, materials);
      }
    }

    res.json({
      success: true,
      message: '包装配置更新成功'
    });
  } catch (error) {
    console.error('更新包装配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新包装配置失败'
    });
  }
};

// 删除包装配置
exports.deletePackagingConfig = (req, res) => {
  try {
    const { id } = req.params;
    PackagingConfig.delete(id);

    res.json({
      success: true,
      message: '包装配置删除成功'
    });
  } catch (error) {
    console.error('删除包装配置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除包装配置失败'
    });
  }
};

// 获取工序列表
exports.getProcessConfigs = (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const processes = ProcessConfig.findByPackagingConfigId(packagingConfigId);
    
    res.json({
      success: true,
      data: processes
    });
  } catch (error) {
    console.error('获取工序列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工序列表失败'
    });
  }
};

// 创建工序
exports.createProcessConfig = (req, res) => {
  try {
    const { packaging_config_id, process_name, unit_price, sort_order } = req.body;

    if (!packaging_config_id || !process_name || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的工序信息'
      });
    }

    const id = ProcessConfig.create({
      packaging_config_id,
      process_name,
      unit_price,
      sort_order
    });

    res.json({
      success: true,
      data: { id },
      message: '工序创建成功'
    });
  } catch (error) {
    console.error('创建工序失败:', error);
    res.status(500).json({
      success: false,
      message: '创建工序失败'
    });
  }
};

// 更新工序
exports.updateProcessConfig = (req, res) => {
  try {
    const { id } = req.params;
    const { process_name, unit_price, sort_order, is_active } = req.body;

    ProcessConfig.update(id, {
      process_name,
      unit_price,
      sort_order,
      is_active: is_active !== undefined ? is_active : 1
    });

    res.json({
      success: true,
      message: '工序更新成功'
    });
  } catch (error) {
    console.error('更新工序失败:', error);
    res.status(500).json({
      success: false,
      message: '更新工序失败'
    });
  }
};

// 删除工序
exports.deleteProcessConfig = (req, res) => {
  try {
    const { id } = req.params;
    ProcessConfig.delete(id);

    res.json({
      success: true,
      message: '工序删除成功'
    });
  } catch (error) {
    console.error('删除工序失败:', error);
    res.status(500).json({
      success: false,
      message: '删除工序失败'
    });
  }
};

// ==================== 包材管理 ====================

// 获取包材列表
exports.getPackagingMaterials = (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const materials = PackagingMaterial.findByPackagingConfigId(packagingConfigId);
    
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('获取包材列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取包材列表失败'
    });
  }
};

// 创建包材
exports.createPackagingMaterial = (req, res) => {
  try {
    const { packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order } = req.body;

    if (!packaging_config_id || !material_name || basic_usage === undefined || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的包材信息'
      });
    }

    const id = PackagingMaterial.create({
      packaging_config_id,
      material_name,
      basic_usage,
      unit_price,
      carton_volume,
      sort_order
    });

    res.json({
      success: true,
      data: { id },
      message: '包材创建成功'
    });
  } catch (error) {
    console.error('创建包材失败:', error);
    res.status(500).json({
      success: false,
      message: '创建包材失败'
    });
  }
};

// 更新包材
exports.updatePackagingMaterial = (req, res) => {
  try {
    const { id } = req.params;
    const { material_name, basic_usage, unit_price, carton_volume, sort_order, is_active } = req.body;

    PackagingMaterial.update(id, {
      material_name,
      basic_usage,
      unit_price,
      carton_volume,
      sort_order,
      is_active: is_active !== undefined ? is_active : 1
    });

    res.json({
      success: true,
      message: '包材更新成功'
    });
  } catch (error) {
    console.error('更新包材失败:', error);
    res.status(500).json({
      success: false,
      message: '更新包材失败'
    });
  }
};

// 删除包材
exports.deletePackagingMaterial = (req, res) => {
  try {
    const { id } = req.params;
    PackagingMaterial.delete(id);

    res.json({
      success: true,
      message: '包材删除成功'
    });
  } catch (error) {
    console.error('删除包材失败:', error);
    res.status(500).json({
      success: false,
      message: '删除包材失败'
    });
  }
};
