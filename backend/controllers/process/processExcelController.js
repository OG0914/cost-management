/**
 * 工序/包材 Excel 导入导出控制器
 */

const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');
const ExcelParser = require('../../utils/excelParser');
const ExcelGenerator = require('../../utils/excel');
const PackagingConfig = require('../../models/PackagingConfig');
const ProcessConfig = require('../../models/ProcessConfig');
const PackagingMaterial = require('../../models/PackagingMaterial');
const Model = require('../../models/Model');
const { PACKAGING_TYPES, formatPackagingMethod } = require('../../config/packagingTypes');

/**
 * 解析包装方式字符串
 */
const parsePackagingMethod = (packagingType, packagingMethod) => {
  const numbers = packagingMethod.match(/\d+/g);
  if (!numbers) return null;

  const config = PACKAGING_TYPES[packagingType];
  if (!config) return null;

  if (config.layers === 2) {
    if (numbers.length < 2) return null;
    return { pc_per_bag: parseInt(numbers[0]), bags_per_box: parseInt(numbers[1]), boxes_per_carton: 1 };
  } else {
    if (numbers.length < 3) return null;
    return { pc_per_bag: parseInt(numbers[0]), bags_per_box: parseInt(numbers[1]), boxes_per_carton: parseInt(numbers[2]) };
  }
};

/**
 * 确保临时目录存在
 */
const ensureTempDir = () => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

/**
 * 清理临时文件
 */
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

/**
 * 导入工序 Excel
 */
exports.importProcesses = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' });

    filePath = req.file.path;
    logger.debug('开始解析工序文件:', filePath);

    const result = await ExcelParser.parseProcessExcel(filePath);
    logger.debug('解析结果:', result);

    if (!result.success) {
      cleanupFile(filePath);
      return res.status(400).json({ success: false, message: '文件解析失败', errors: result.errors });
    }

    if (result.valid === 0) {
      cleanupFile(filePath);
      return res.status(400).json({ success: false, message: '没有有效的数据行' });
    }

    const configMap = new Map();
    const parseErrors = [];

    result.data.forEach((item, index) => {
      const rowNum = index + 2;
      const parsed = parsePackagingMethod(item.packaging_type, item.packaging_method);

      if (!parsed) {
        parseErrors.push(`第 ${rowNum} 行：无法解析包装方式 "${item.packaging_method}"`);
        return;
      }

      const { pc_per_bag, bags_per_box, boxes_per_carton } = parsed;
      const key = `${item.model_name}|${item.config_name}|${item.packaging_type}|${pc_per_bag}|${bags_per_box}|${boxes_per_carton}`;

      if (!configMap.has(key)) {
        configMap.set(key, {
          model_name: item.model_name, config_name: item.config_name, packaging_type: item.packaging_type,
          pc_per_bag, bags_per_box, boxes_per_carton, processes: []
        });
      }

      configMap.get(key).processes.push({ process_name: item.process_name, unit_price: item.unit_price });
    });

    let created = 0, updated = 0;
    const errors = [...parseErrors];

    for (const [, configData] of configMap) {
      const model = await Model.findByName(configData.model_name);
      if (!model) {
        errors.push(`型号 "${configData.model_name}" 不存在，请先创建该型号`);
        continue;
      }

      const existingConfigs = await PackagingConfig.findByModelId(model.id);
      let config = existingConfigs.find(c =>
        c.config_name === configData.config_name && c.packaging_type === configData.packaging_type &&
        c.pc_per_bag === configData.pc_per_bag && c.bags_per_box === configData.bags_per_box &&
        c.boxes_per_carton === configData.boxes_per_carton
      );

      if (config) {
        await ProcessConfig.deleteByPackagingConfigId(config.id);
        await ProcessConfig.createBatch(config.id, configData.processes);
        updated++;
      } else {
        const configId = await PackagingConfig.create({
          model_id: model.id, config_name: configData.config_name, packaging_type: configData.packaging_type,
          pc_per_bag: configData.pc_per_bag, bags_per_box: configData.bags_per_box, boxes_per_carton: configData.boxes_per_carton
        });
        await ProcessConfig.createBatch(configId, configData.processes);
        created++;
      }
    }

    cleanupFile(filePath);
    res.json({
      success: true,
      data: { total: result.total, valid: result.valid, created, updated, errors: errors.length > 0 ? errors : undefined },
      message: errors.length > 0 ? `部分导入成功。创建 ${created} 条，更新 ${updated} 条。${errors.length} 个错误。` : '导入成功'
    });
  } catch (error) {
    logger.error('导入工序失败:', error);
    cleanupFile(filePath);
    res.status(500).json({ success: false, message: '导入失败: ' + error.message });
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

    if (configs.length === 0) return res.status(400).json({ success: false, message: '没有可导出的数据' });

    const processes = [];
    for (const config of configs) {
      const configProcesses = await ProcessConfig.findByPackagingConfigId(config.id);
      const packagingType = config.packaging_type || 'standard_box';
      const layer1 = config.layer1_qty ?? config.pc_per_bag;
      const layer2 = config.layer2_qty ?? config.bags_per_box;
      const layer3 = config.layer3_qty ?? config.boxes_per_carton;
      const packagingMethod = formatPackagingMethod(packagingType, layer1, layer2, layer3);

      configProcesses.forEach(p => {
        processes.push({
          model_name: config.model_name, config_name: config.config_name,
          packaging_type: packagingType, packaging_method: packagingMethod,
          process_name: p.process_name, unit_price: p.unit_price
        });
      });
    }

    const workbook = await ExcelGenerator.generateProcessExcel(processes);
    const fileName = `工序清单_${Date.now()}.xlsx`;
    const tempDir = ensureTempDir();
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, fileName, (err) => {
      cleanupFile(filePath);
      if (err) logger.error('下载失败:', err);
    });
  } catch (error) {
    logger.error('导出工序失败:', error);
    res.status(500).json({ success: false, message: '导出失败' });
  }
};

/**
 * 下载工序导入模板
 */
exports.downloadProcessTemplate = async (req, res) => {
  try {
    const workbook = await ExcelGenerator.generateProcessTemplate();
    const fileName = '工序导入模板.xlsx';
    const tempDir = ensureTempDir();
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, fileName, (err) => {
      cleanupFile(filePath);
      if (err) logger.error('下载失败:', err);
    });
  } catch (error) {
    logger.error('下载模板失败:', error);
    res.status(500).json({ success: false, message: '下载模板失败' });
  }
};

/**
 * 导入包材 Excel
 */
exports.importPackagingMaterials = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' });

    filePath = req.file.path;
    logger.debug('开始解析包材文件:', filePath);

    const result = await ExcelParser.parsePackagingMaterialExcel(filePath);
    logger.debug('解析结果:', result);

    if (!result.success) {
      cleanupFile(filePath);
      return res.status(400).json({ success: false, message: '文件解析失败', errors: result.errors });
    }

    if (result.valid === 0) {
      cleanupFile(filePath);
      return res.status(400).json({ success: false, message: '没有有效的数据行' });
    }

    const configMap = new Map();
    const parseErrors = [];

    result.data.forEach((item, index) => {
      const rowNum = index + 2;
      const parsed = parsePackagingMethod(item.packaging_type, item.packaging_method);

      if (!parsed) {
        parseErrors.push(`第 ${rowNum} 行：无法解析包装方式 "${item.packaging_method}"`);
        return;
      }

      const { pc_per_bag, bags_per_box, boxes_per_carton } = parsed;
      const key = `${item.model_name}|${item.config_name}|${item.packaging_type}|${pc_per_bag}|${bags_per_box}|${boxes_per_carton}`;

      if (!configMap.has(key)) {
        configMap.set(key, {
          model_name: item.model_name, config_name: item.config_name, packaging_type: item.packaging_type,
          pc_per_bag, bags_per_box, boxes_per_carton, materials: []
        });
      }

      configMap.get(key).materials.push({
        material_name: item.material_name, basic_usage: item.basic_usage,
        unit_price: item.unit_price, carton_volume: item.carton_volume
      });
    });

    let created = 0, updated = 0;
    const errors = [...parseErrors];

    for (const [, configData] of configMap) {
      const model = await Model.findByName(configData.model_name);
      if (!model) {
        errors.push(`型号 "${configData.model_name}" 不存在，请先创建该型号`);
        continue;
      }

      const existingConfigs = await PackagingConfig.findByModelId(model.id);
      let config = existingConfigs.find(c =>
        c.config_name === configData.config_name && c.packaging_type === configData.packaging_type &&
        c.pc_per_bag === configData.pc_per_bag && c.bags_per_box === configData.bags_per_box &&
        c.boxes_per_carton === configData.boxes_per_carton
      );

      if (config) {
        await PackagingMaterial.deleteByPackagingConfigId(config.id);
        await PackagingMaterial.createBatch(config.id, configData.materials);
        updated++;
      } else {
        const configId = await PackagingConfig.create({
          model_id: model.id, config_name: configData.config_name, packaging_type: configData.packaging_type,
          pc_per_bag: configData.pc_per_bag, bags_per_box: configData.bags_per_box, boxes_per_carton: configData.boxes_per_carton
        });
        await PackagingMaterial.createBatch(configId, configData.materials);
        created++;
      }
    }

    cleanupFile(filePath);
    res.json({
      success: true,
      data: { total: result.total, valid: result.valid, created, updated, errors: errors.length > 0 ? errors : undefined },
      message: errors.length > 0 ? `部分导入成功。创建 ${created} 条，更新 ${updated} 条。${errors.length} 个错误。` : '导入成功'
    });
  } catch (error) {
    logger.error('导入包材失败:', error);
    cleanupFile(filePath);
    res.status(500).json({ success: false, message: '导入失败: ' + error.message });
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

    if (configs.length === 0) return res.status(400).json({ success: false, message: '没有可导出的数据' });

    const materials = [];
    for (const config of configs) {
      const configMaterials = await PackagingMaterial.findByPackagingConfigId(config.id);
      const packagingType = config.packaging_type || 'standard_box';
      const layer1 = config.layer1_qty ?? config.pc_per_bag;
      const layer2 = config.layer2_qty ?? config.bags_per_box;
      const layer3 = config.layer3_qty ?? config.boxes_per_carton;
      const packagingMethod = formatPackagingMethod(packagingType, layer1, layer2, layer3);

      configMaterials.forEach(m => {
        materials.push({
          model_name: config.model_name, config_name: config.config_name,
          packaging_type: packagingType, packaging_method: packagingMethod,
          material_name: m.material_name, basic_usage: m.basic_usage,
          unit_price: m.unit_price, carton_volume: m.carton_volume
        });
      });
    }

    const workbook = await ExcelGenerator.generatePackagingMaterialExcel(materials);
    const fileName = `包材清单_${Date.now()}.xlsx`;
    const tempDir = ensureTempDir();
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, fileName, (err) => {
      cleanupFile(filePath);
      if (err) logger.error('下载失败:', err);
    });
  } catch (error) {
    logger.error('导出包材失败:', error);
    res.status(500).json({ success: false, message: '导出失败' });
  }
};

/**
 * 下载包材导入模板
 */
exports.downloadPackagingMaterialTemplate = async (req, res) => {
  try {
    const workbook = await ExcelGenerator.generatePackagingMaterialTemplate();
    const fileName = '包材导入模板.xlsx';
    const tempDir = ensureTempDir();
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, fileName, (err) => {
      cleanupFile(filePath);
      if (err) logger.error('下载失败:', err);
    });
  } catch (error) {
    logger.error('下载模板失败:', error);
    res.status(500).json({ success: false, message: '下载模板失败' });
  }
};
