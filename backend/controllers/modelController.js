/**
 * 型号控制器
 */

const Model = require('../models/Model');
const Regulation = require('../models/Regulation');
const ExcelParser = require('../utils/excelParser');
const ExcelGenerator = require('../utils/excel');
const { success, error } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// 获取所有型号（支持 model_category、regulation_id、model_series 过滤）
const getAllModels = async (req, res, next) => {
  try {
    const { model_category, regulation_id, model_series } = req.query;

    let models;
    if (model_series) {
      models = await Model.findBySeries(model_series); // 按产品系列过滤
    } else if (model_category && regulation_id) {
      models = await Model.findByModelCategoryAndRegulation(model_category, regulation_id); // 同时按型号分类和法规过滤
    } else if (model_category) {
      models = await Model.findByModelCategory(model_category); // 只按型号分类过滤
    } else {
      models = await Model.findAll(); // 获取所有型号
    }

    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 获取所有型号（带BOM数量，用于BOM复制选择）
const getModelsWithBomCount = async (req, res, next) => {
  try {
    const models = await Model.findAllWithBomCount();
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 获取激活的型号
const getActiveModels = async (req, res, next) => {
  try {
    const models = await Model.findActive();
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 根据法规 ID 获取型号
const getModelsByRegulation = async (req, res, next) => {
  try {
    const { regulationId } = req.params;
    const models = await Model.findByRegulationId(regulationId);
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 根据 ID 获取型号
const getModelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }

    res.json(success(model));
  } catch (err) {
    next(err);
  }
};

// 创建型号
const createModel = async (req, res, next) => {
  try {
    const { regulation_id, model_name, model_category, model_series } = req.body;

    if (!regulation_id || !model_name) {
      return res.status(400).json(error('法规类别和型号名称不能为空', 400));
    }

    const id = await Model.create({ regulation_id, model_name, model_category, model_series });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新型号
const updateModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { regulation_id, model_name, model_category, model_series, is_active } = req.body;

    const model = await Model.findById(id);
    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }

    if (!regulation_id || !model_name) {
      return res.status(400).json(error('法规类别和型号名称不能为空', 400));
    }

    await Model.update(id, { regulation_id, model_name, model_category, model_series, is_active: is_active !== undefined ? is_active : 1 });
    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除型号
const deleteModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const model = await Model.findById(id);
    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }

    // 检查是否被报价单使用
    if (await Model.isUsedInQuotations(id)) {
      return res.status(400).json(error('该型号已被报价单使用，无法删除', 400));
    }

    await Model.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// 导入型号 Excel
const importModels = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(error('请上传文件', 400));
    }

    const filePath = req.file.path;
    const result = await ExcelParser.parseModelExcel(filePath);

    // 删除临时文件
    fs.unlinkSync(filePath);

    if (!result.success) {
      return res.status(400).json(error('文件解析失败', 400, result.errors));
    }

    // 导入数据
    let created = 0;
    let updated = 0;
    const errors = [];

    for (let index = 0; index < result.data.length; index++) {
      const modelData = result.data[index];
      try {
        // 查找法规ID
        const regulation = await Regulation.findByName(modelData.regulation_name);
        if (!regulation) {
          errors.push(`第 ${index + 2} 行：法规类别"${modelData.regulation_name}"不存在`);
          continue;
        }

        // 检查型号是否已存在（根据法规ID和型号名称）
        const existing = await Model.findByRegulationAndName(regulation.id, modelData.model_name);

        if (existing) {
          // 更新已存在的型号
          await Model.update(existing.id, {
            regulation_id: regulation.id,
            model_name: modelData.model_name,
            model_category: modelData.model_category || existing.model_category,
            model_series: modelData.model_series || existing.model_series,
            is_active: 1
          });
          updated++;
        } else {
          // 创建新型号
          await Model.create({
            regulation_id: regulation.id,
            model_name: modelData.model_name,
            model_category: modelData.model_category || '',
            model_series: modelData.model_series || ''
          });
          created++;
        }
      } catch (err) {
        errors.push(`第 ${index + 2} 行：${err.message}`);
      }
    }

    res.json(success({
      total: result.total,
      valid: result.valid,
      created,
      updated,
      errors
    }, '导入完成'));
  } catch (err) {
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// 导出型号 Excel
const exportModels = async (req, res, next) => {
  try {
    const { ids } = req.body;

    let models;
    if (ids && ids.length > 0) {
      // 导出选中的数据
      const modelPromises = ids.map(id => Model.findById(id));
      models = (await Promise.all(modelPromises)).filter(m => m !== null);
    } else {
      // 如果没有指定ID，导出所有数据
      models = await Model.findAll();
    }

    if (models.length === 0) {
      return res.status(400).json(error('没有可导出的数据', 400));
    }

    const workbook = await ExcelGenerator.generateModelExcel(models);

    // 生成文件
    const fileName = `型号清单_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // 确保 temp 目录存在
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    // 发送文件
    res.download(filePath, fileName, (err) => {
      // 删除临时文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
};

// 下载导入模板
const downloadTemplate = async (req, res, next) => {
  try {
    const workbook = await ExcelGenerator.generateModelTemplate();

    const fileName = '型号导入模板.xlsx';
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
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
};

// 获取所有型号分类
const getModelCategories = async (req, res, next) => {
  try {
    const categories = await Model.getAllCategories();
    res.json(success(categories));
  } catch (err) {
    next(err);
  }
};

// 获取所有产品系列
const getModelSeries = async (req, res, next) => {
  try {
    const series = await Model.getAllSeries();
    res.json(success(series));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllModels,
  getModelsWithBomCount,
  getActiveModels,
  getModelsByRegulation,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  importModels,
  exportModels,
  downloadTemplate,
  getModelCategories,
  getModelSeries
};
