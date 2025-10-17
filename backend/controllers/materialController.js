/**
 * 原料控制器
 */

const Material = require('../models/Material');
const ExcelParser = require('../utils/excelParser');
const ExcelGenerator = require('../utils/excelGenerator');
const { success, error } = require('../utils/response');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 获取所有原料
const getAllMaterials = (req, res, next) => {
  try {
    const materials = Material.findAll();
    res.json(success(materials));
  } catch (err) {
    next(err);
  }
};

// 根据型号获取原料
const getMaterialsByModel = (req, res, next) => {
  try {
    const { modelId } = req.params;
    const materials = Material.findByModelId(modelId);
    res.json(success(materials));
  } catch (err) {
    next(err);
  }
};

// 根据 ID 获取原料
const getMaterialById = (req, res, next) => {
  try {
    const { id } = req.params;
    const material = Material.findById(id);
    
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    res.json(success(material));
  } catch (err) {
    next(err);
  }
};

// 创建原料
const createMaterial = (req, res, next) => {
  try {
    const { name, unit, price, currency, model_id, usage_amount } = req.body;
    
    if (!name || !unit || !price) {
      return res.status(400).json(error('原料名称、单位和单价不能为空', 400));
    }
    
    const id = Material.create({ name, unit, price, currency, model_id, usage_amount });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新原料
const updateMaterial = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit, price, currency, model_id, usage_amount } = req.body;
    
    const material = Material.findById(id);
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    if (!name || !unit || !price) {
      return res.status(400).json(error('原料名称、单位和单价不能为空', 400));
    }
    
    Material.update(id, { name, unit, price, currency, model_id, usage_amount });
    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除原料
const deleteMaterial = (req, res, next) => {
  try {
    const { id } = req.params;
    
    const material = Material.findById(id);
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    Material.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// 导入原料 Excel
const importMaterials = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(error('请上传文件', 400));
    }
    
    const filePath = req.file.path;
    const result = ExcelParser.parseMaterialExcel(filePath);
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    if (!result.success) {
      return res.status(400).json(error('文件解析失败', 400, result.errors));
    }
    
    // 导入数据（更新已存在的，创建新的）
    let created = 0;
    let updated = 0;
    
    result.data.forEach(material => {
      const existing = Material.findByName(material.name);
      if (existing) {
        Material.update(existing.id, material);
        updated++;
      } else {
        Material.create(material);
        created++;
      }
    });
    
    res.json(success({
      total: result.total,
      valid: result.valid,
      created,
      updated
    }, '导入成功'));
  } catch (err) {
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// 导出原料 Excel
const exportMaterials = (req, res, next) => {
  try {
    const materials = Material.findAll();
    const workbook = ExcelGenerator.generateMaterialExcel(materials);
    
    // 生成文件
    const fileName = `原料清单_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);
    
    // 确保 temp 目录存在
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    XLSX.writeFile(workbook, filePath);
    
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
const downloadTemplate = (req, res, next) => {
  try {
    const workbook = ExcelGenerator.generateMaterialTemplate();
    
    const fileName = '原料导入模板.xlsx';
    const filePath = path.join(__dirname, '../temp', fileName);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    XLSX.writeFile(workbook, filePath);
    
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

module.exports = {
  getAllMaterials,
  getMaterialsByModel,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  importMaterials,
  exportMaterials,
  downloadTemplate
};
