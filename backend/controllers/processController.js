/**
 * 工序管理控制器
 * PostgreSQL 异步版本
 */

const PackagingConfig = require('../models/PackagingConfig');
const ProcessConfig = require('../models/ProcessConfig');
const PackagingMaterial = require('../models/PackagingMaterial');
const SystemConfig = require('../models/SystemConfig');

// 获取所有包装配置
exports.getAllPackagingConfigs = async (req, res) => {
  try {
    const configs = await PackagingConfig.findAll();
    
    // 获取工价系数
    const processCoefficient = parseFloat(await SystemConfig.getValue('process_coefficient')) || 1.56;
    
    // 为每个配置计算工序总价和包材总价
    const configsWithPrice = await Promise.all(configs.map(async config => {
      const processes = await ProcessConfig.findByPackagingConfigId(config.id);
      const processSum = processes.reduce((sum, p) => sum + parseFloat(p.unit_price), 0);
      const processTotalPrice = processSum * processCoefficient;
      
      const materials = await PackagingMaterial.findByPackagingConfigId(config.id);
      // 包材总价 = Σ(单价 ÷ 基本用量)
      const materialTotalPrice = materials.reduce((sum, m) => {
        return sum + (m.basic_usage !== 0 ? parseFloat(m.unit_price) / parseFloat(m.basic_usage) : 0);
      }, 0);
      
      return {
        ...config,
        process_total_price: processTotalPrice,
        material_total_price: materialTotalPrice
      };
    }));
    
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
exports.getPackagingConfigsByModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const configs = await PackagingConfig.findByModelId(modelId);

    // 获取工价系数
    const processCoefficient = parseFloat(await SystemConfig.getValue('process_coefficient')) || 1.56;
    
    // 为每个配置计算工序总价和包材总价
    const configsWithPrice = await Promise.all(configs.map(async config => {
      const processes = await ProcessConfig.findByPackagingConfigId(config.id);
      const processSum = processes.reduce((sum, p) => sum + parseFloat(p.unit_price), 0);
      const processTotalPrice = processSum * processCoefficient;
      
      const materials = await PackagingMaterial.findByPackagingConfigId(config.id);
      // 包材总价 = Σ(单价 ÷ 基本用量)
      const materialTotalPrice = materials.reduce((sum, m) => {
        return sum + (m.basic_usage !== 0 ? parseFloat(m.unit_price) / parseFloat(m.basic_usage) : 0);
      }, 0);
      
      return {
        ...config,
        process_total_price: processTotalPrice,
        material_total_price: materialTotalPrice
      };
    }));
    
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
exports.getPackagingConfigDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PackagingConfig.findWithProcesses(id);
    
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
exports.getPackagingConfigFullDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PackagingConfig.findWithDetails(id);
    
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
exports.createPackagingConfig = async (req, res) => {
  try {
    const { model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton, processes, materials } = req.body;

    // 验证必填字段
    if (!model_id || !config_name || !pc_per_bag || !bags_per_box || !boxes_per_carton) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的包装配置信息'
      });
    }

    // 检查配置名称是否已存在
    if (await PackagingConfig.existsByModelAndName(model_id, config_name)) {
      return res.status(400).json({
        success: false,
        message: '该型号下已存在同名的配置，请修改配置名称'
      });
    }

    // 创建包装配置
    const configId = await PackagingConfig.create({
      model_id,
      config_name,
      pc_per_bag,
      bags_per_box,
      boxes_per_carton
    });

    // 如果有工序列表，批量创建
    if (processes && processes.length > 0) {
      await ProcessConfig.createBatch(configId, processes);
    }

    // 如果有包材列表，批量创建
    if (materials && materials.length > 0) {
      await PackagingMaterial.createBatch(configId, materials);
    }

    res.json({
      success: true,
      data: { id: configId },
      message: '包装配置创建成功'
    });
  } catch (error) {
    console.error('创建包装配置失败:', error);
    
    // 检查是否是唯一性约束错误（PostgreSQL）
    if (error.code === '23505' || 
        (error.message && error.message.includes('duplicate key'))) {
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
exports.updatePackagingConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active, processes, materials } = req.body;

    // 更新包装配置
    await PackagingConfig.update(id, {
      config_name,
      pc_per_bag,
      bags_per_box,
      boxes_per_carton,
      is_active: is_active !== undefined ? is_active : true
    });

    // 如果提供了工序列表，先删除旧的，再创建新的
    if (processes) {
      await ProcessConfig.deleteByPackagingConfigId(id);
      if (processes.length > 0) {
        await ProcessConfig.createBatch(id, processes);
      }
    }

    // 如果提供了包材列表，先删除旧的，再创建新的
    if (materials) {
      await PackagingMaterial.deleteByPackagingConfigId(id);
      if (materials.length > 0) {
        await PackagingMaterial.createBatch(id, materials);
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
exports.deletePackagingConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await PackagingConfig.delete(id);

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
exports.getProcessConfigs = async (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const processes = await ProcessConfig.findByPackagingConfigId(packagingConfigId);
    
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
exports.createProcessConfig = async (req, res) => {
  try {
    const { packaging_config_id, process_name, unit_price, sort_order } = req.body;

    if (!packaging_config_id || !process_name || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的工序信息'
      });
    }

    const id = await ProcessConfig.create({
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
exports.updateProcessConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { process_name, unit_price, sort_order, is_active } = req.body;

    await ProcessConfig.update(id, {
      process_name,
      unit_price,
      sort_order,
      is_active: is_active !== undefined ? is_active : true
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
exports.deleteProcessConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await ProcessConfig.delete(id);

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
exports.getPackagingMaterials = async (req, res) => {
  try {
    const { packagingConfigId } = req.params;
    const materials = await PackagingMaterial.findByPackagingConfigId(packagingConfigId);
    
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
exports.createPackagingMaterial = async (req, res) => {
  try {
    const { packaging_config_id, material_name, basic_usage, unit_price, carton_volume, sort_order } = req.body;

    if (!packaging_config_id || !material_name || basic_usage === undefined || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的包材信息'
      });
    }

    const id = await PackagingMaterial.create({
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
exports.updatePackagingMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { material_name, basic_usage, unit_price, carton_volume, sort_order, is_active } = req.body;

    await PackagingMaterial.update(id, {
      material_name,
      basic_usage,
      unit_price,
      carton_volume,
      sort_order,
      is_active: is_active !== undefined ? is_active : true
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
exports.deletePackagingMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await PackagingMaterial.delete(id);

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


// ==================== Excel 导入导出 ====================

const ExcelParser = require('../utils/excelParser');
const ExcelGenerator = require('../utils/excelGenerator');
const Model = require('../models/Model');
const fs = require('fs');
const path = require('path');

/**
 * 导入工序 Excel
 */
exports.importProcesses = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }
    
    filePath = req.file.path;
    console.log('开始解析工序文件:', filePath);
    
    const result = await ExcelParser.parseProcessExcel(filePath);
    console.log('解析结果:', result);
    
    if (!result.success) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: '文件解析失败',
        errors: result.errors
      });
    }
    
    if (result.valid === 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: '没有有效的数据行'
      });
    }
    
    // 按配置分组处理数据
    const configMap = new Map();
    
    result.data.forEach(item => {
      const packagingMatch = item.packaging_method.match(/(\d+)pc\/bag.*?(\d+)bags?\/box.*?(\d+)boxes?\/carton/i);
      if (!packagingMatch) {
        return;
      }
      
      const [, pc_per_bag, bags_per_box, boxes_per_carton] = packagingMatch;
      
      const key = `${item.model_name}|${item.config_name}|${pc_per_bag}|${bags_per_box}|${boxes_per_carton}`;
      
      if (!configMap.has(key)) {
        configMap.set(key, {
          model_name: item.model_name,
          config_name: item.config_name,
          pc_per_bag: parseInt(pc_per_bag),
          bags_per_box: parseInt(bags_per_box),
          boxes_per_carton: parseInt(boxes_per_carton),
          processes: []
        });
      }
      
      configMap.get(key).processes.push({
        process_name: item.process_name,
        unit_price: item.unit_price
      });
    });
    
    let created = 0;
    let updated = 0;
    const errors = [];
    
    // 处理每个配置
    for (const [key, configData] of configMap) {
      // 查找型号
      const model = await Model.findByName(configData.model_name);
      if (!model) {
        errors.push(`型号 "${configData.model_name}" 不存在，请先创建该型号`);
        continue;
      }
      
      // 查找或创建配置
      const existingConfigs = await PackagingConfig.findByModelId(model.id);
      let config = existingConfigs.find(c => 
        c.config_name === configData.config_name &&
        c.pc_per_bag === configData.pc_per_bag &&
        c.bags_per_box === configData.bags_per_box &&
        c.boxes_per_carton === configData.boxes_per_carton
      );
      
      if (config) {
        // 更新：删除旧工序，添加新工序
        await ProcessConfig.deleteByPackagingConfigId(config.id);
        await ProcessConfig.createBatch(config.id, configData.processes);
        updated++;
      } else {
        // 创建新配置
        const configId = await PackagingConfig.create({
          model_id: model.id,
          config_name: configData.config_name,
          pc_per_bag: configData.pc_per_bag,
          bags_per_box: configData.bags_per_box,
          boxes_per_carton: configData.boxes_per_carton
        });
        await ProcessConfig.createBatch(configId, configData.processes);
        created++;
      }
    }
    
    // 删除临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({
      success: true,
      data: {
        total: result.total,
        valid: result.valid,
        created,
        updated,
        errors: errors.length > 0 ? errors : undefined
      },
      message: errors.length > 0 
        ? `部分导入成功。创建 ${created} 条，更新 ${updated} 条。${errors.length} 个错误。`
        : '导入成功'
    });
  } catch (error) {
    console.error('导入工序失败:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({
      success: false,
      message: '导入失败: ' + error.message
    });
  }
};

/**
 * 导出工序 Excel
 */
exports.exportProcesses = async (req, res) => {
  try {
    const { ids } = req.body;
    
    let configs;
    if (ids && ids.length > 0) {
      const configPromises = ids.map(id => PackagingConfig.findById(id));
      configs = (await Promise.all(configPromises)).filter(c => c !== null);
    } else {
      configs = await PackagingConfig.findAll();
    }
    
    if (configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可导出的数据'
      });
    }
    
    const processes = [];
    
    for (const config of configs) {
      const configProcesses = await ProcessConfig.findByPackagingConfigId(config.id);
      const packagingMethod = `${config.pc_per_bag}pc/bag, ${config.bags_per_box}bags/box, ${config.boxes_per_carton}boxes/carton`;
      
      configProcesses.forEach(p => {
        processes.push({
          model_name: config.model_name,
          config_name: config.config_name,
          packaging_method: packagingMethod,
          process_name: p.process_name,
          unit_price: p.unit_price
        });
      });
    }
    
    const workbook = await ExcelGenerator.generateProcessExcel(processes);
    
    const fileName = `工序清单_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    res.download(filePath, fileName, (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('下载失败:', err);
      }
    });
  } catch (error) {
    console.error('导出工序失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
};

/**
 * 下载工序导入模板
 */
exports.downloadProcessTemplate = async (req, res) => {
  try {
    const workbook = await ExcelGenerator.generateProcessTemplate();
    
    const fileName = '工序导入模板.xlsx';
    const filePath = path.join(__dirname, '../temp', fileName);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    res.download(filePath, fileName, (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('下载失败:', err);
      }
    });
  } catch (error) {
    console.error('下载模板失败:', error);
    res.status(500).json({
      success: false,
      message: '下载模板失败'
    });
  }
};

/**
 * 导入包材 Excel
 */
exports.importPackagingMaterials = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }
    
    filePath = req.file.path;
    console.log('开始解析包材文件:', filePath);
    
    const result = await ExcelParser.parsePackagingMaterialExcel(filePath);
    console.log('解析结果:', result);
    
    if (!result.success) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: '文件解析失败',
        errors: result.errors
      });
    }
    
    if (result.valid === 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: '没有有效的数据行'
      });
    }
    
    // 按配置分组处理数据
    const configMap = new Map();
    
    result.data.forEach(item => {
      const packagingMatch = item.packaging_method.match(/(\d+)pc\/bag.*?(\d+)bags?\/box.*?(\d+)boxes?\/carton/i);
      if (!packagingMatch) {
        return;
      }
      
      const [, pc_per_bag, bags_per_box, boxes_per_carton] = packagingMatch;
      
      const key = `${item.model_name}|${item.config_name}|${pc_per_bag}|${bags_per_box}|${boxes_per_carton}`;
      
      if (!configMap.has(key)) {
        configMap.set(key, {
          model_name: item.model_name,
          config_name: item.config_name,
          pc_per_bag: parseInt(pc_per_bag),
          bags_per_box: parseInt(bags_per_box),
          boxes_per_carton: parseInt(boxes_per_carton),
          materials: []
        });
      }
      
      configMap.get(key).materials.push({
        material_name: item.material_name,
        basic_usage: item.basic_usage,
        unit_price: item.unit_price,
        carton_volume: item.carton_volume
      });
    });
    
    let created = 0;
    let updated = 0;
    const errors = [];
    
    // 处理每个配置
    for (const [key, configData] of configMap) {
      // 查找型号
      const model = await Model.findByName(configData.model_name);
      if (!model) {
        errors.push(`型号 "${configData.model_name}" 不存在，请先创建该型号`);
        continue;
      }
      
      // 查找或创建配置
      const existingConfigs = await PackagingConfig.findByModelId(model.id);
      let config = existingConfigs.find(c => 
        c.config_name === configData.config_name &&
        c.pc_per_bag === configData.pc_per_bag &&
        c.bags_per_box === configData.bags_per_box &&
        c.boxes_per_carton === configData.boxes_per_carton
      );
      
      if (config) {
        // 更新：删除旧包材，添加新包材
        await PackagingMaterial.deleteByPackagingConfigId(config.id);
        await PackagingMaterial.createBatch(config.id, configData.materials);
        updated++;
      } else {
        // 创建新配置
        const configId = await PackagingConfig.create({
          model_id: model.id,
          config_name: configData.config_name,
          pc_per_bag: configData.pc_per_bag,
          bags_per_box: configData.bags_per_box,
          boxes_per_carton: configData.boxes_per_carton
        });
        await PackagingMaterial.createBatch(configId, configData.materials);
        created++;
      }
    }
    
    // 删除临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({
      success: true,
      data: {
        total: result.total,
        valid: result.valid,
        created,
        updated,
        errors: errors.length > 0 ? errors : undefined
      },
      message: errors.length > 0 
        ? `部分导入成功。创建 ${created} 条，更新 ${updated} 条。${errors.length} 个错误。`
        : '导入成功'
    });
  } catch (error) {
    console.error('导入包材失败:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({
      success: false,
      message: '导入失败: ' + error.message
    });
  }
};

/**
 * 导出包材 Excel
 */
exports.exportPackagingMaterials = async (req, res) => {
  try {
    const { ids } = req.body;
    
    let configs;
    if (ids && ids.length > 0) {
      const configPromises = ids.map(id => PackagingConfig.findById(id));
      configs = (await Promise.all(configPromises)).filter(c => c !== null);
    } else {
      configs = await PackagingConfig.findAll();
    }
    
    if (configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可导出的数据'
      });
    }
    
    const materials = [];
    
    for (const config of configs) {
      const configMaterials = await PackagingMaterial.findByPackagingConfigId(config.id);
      const packagingMethod = `${config.pc_per_bag}pc/bag, ${config.bags_per_box}bags/box, ${config.boxes_per_carton}boxes/carton`;
      
      configMaterials.forEach(m => {
        materials.push({
          model_name: config.model_name,
          config_name: config.config_name,
          packaging_method: packagingMethod,
          material_name: m.material_name,
          basic_usage: m.basic_usage,
          unit_price: m.unit_price,
          carton_volume: m.carton_volume
        });
      });
    }
    
    const workbook = await ExcelGenerator.generatePackagingMaterialExcel(materials);
    
    const fileName = `包材清单_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    res.download(filePath, fileName, (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('下载失败:', err);
      }
    });
  } catch (error) {
    console.error('导出包材失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
};

/**
 * 下载包材导入模板
 */
exports.downloadPackagingMaterialTemplate = async (req, res) => {
  try {
    const workbook = await ExcelGenerator.generatePackagingMaterialTemplate();
    
    const fileName = '包材导入模板.xlsx';
    const filePath = path.join(__dirname, '../temp', fileName);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    res.download(filePath, fileName, (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('下载失败:', err);
      }
    });
  } catch (error) {
    console.error('下载模板失败:', error);
    res.status(500).json({
      success: false,
      message: '下载模板失败'
    });
  }
};
