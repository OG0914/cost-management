/**
 * 原料控制器
 */

const Material = require('../models/Material');
const ExcelParser = require('../utils/excelParser');
const ExcelGenerator = require('../utils/excelGenerator');
const { success, error, paginated } = require('../utils/response');
const QueryBuilder = require('../utils/queryBuilder');
const dbManager = require('../db/database');
const path = require('path');
const fs = require('fs');

/**
 * 获取原料列表（支持分页和搜索）
 * GET /api/materials
 * @query {number} page - 页码，默认 1
 * @query {number} pageSize - 每页条数，默认 20，最大 100
 * @query {string} keyword - 搜索关键词（匹配品号或原料名称）
 */
const getAllMaterials = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    
    // 参数校验和规范化
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    // 构建查询
    const query = new QueryBuilder('materials');
    
    // 关键词搜索（品号或原料名称）
    if (keyword && keyword.trim()) {
      query.whereLikeOr(['item_no', 'name'], keyword);
    }
    
    // 排序
    query.orderByDesc('updated_at');
    
    // 获取总数
    const countResult = query.clone().buildCount();
    const countData = await dbManager.query(countResult.sql, countResult.params);
    const total = parseInt(countData.rows[0].total);
    
    // 分页查询
    query.limit(pageSizeNum).offset(offset);
    const selectResult = query.buildSelect();
    const data = await dbManager.query(selectResult.sql, selectResult.params);

    res.json(paginated(data.rows, total, pageNum, pageSizeNum));
  } catch (err) {
    next(err);
  }
};

// 根据厂商获取原料
const getMaterialsByManufacturer = async (req, res, next) => {
  try {
    const { manufacturer } = req.params;
    const materials = await Material.findByManufacturer(manufacturer);
    res.json(success(materials));
  } catch (err) {
    next(err);
  }
};

// 根据 ID 获取原料
const getMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    res.json(success(material));
  } catch (err) {
    next(err);
  }
};

// 创建原料
const createMaterial = async (req, res, next) => {
  try {
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = req.body;
    
    if (!item_no || !name || !unit || !price) {
      return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));
    }
    
    const id = await Material.create({ item_no, name, unit, price, currency, manufacturer, usage_amount });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新原料
const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_no, name, unit, price, currency, manufacturer, usage_amount } = req.body;
    
    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    if (!item_no || !name || !unit || !price) {
      return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));
    }
    
    await Material.update(id, { item_no, name, unit, price, currency, manufacturer, usage_amount }, req.user?.id);
    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除原料
const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    await Material.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// 导入原料 Excel
const importMaterials = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(error('请上传文件', 400));
    }
    
    const filePath = req.file.path;
    const result = await ExcelParser.parseMaterialExcel(filePath);
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    if (!result.success) {
      return res.status(400).json(error('文件解析失败', 400, result.errors));
    }
    
    // 导入数据（根据品号更新已存在的，创建新的）
    let created = 0;
    let updated = 0;
    
    for (let index = 0; index < result.data.length; index++) {
      const material = result.data[index];
      console.log(`处理第 ${index + 1} 条数据:`, JSON.stringify(material));
      const existing = await Material.findByItemNo(material.item_no);
      if (existing) {
        await Material.update(existing.id, material);
        updated++;
      } else {
        await Material.create(material);
        created++;
      }
    }
    
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
const exportMaterials = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    let materials;
    if (ids && ids.length > 0) {
      // 导出选中的数据
      const materialPromises = ids.map(id => Material.findById(id));
      materials = (await Promise.all(materialPromises)).filter(m => m !== null);
    } else {
      // 如果没有指定ID，导出所有数据
      materials = await Material.findAll();
    }
    
    if (materials.length === 0) {
      return res.status(400).json(error('没有可导出的数据', 400));
    }
    
    const workbook = await ExcelGenerator.generateMaterialExcel(materials);
    
    // 生成文件
    const fileName = `原料清单_${Date.now()}.xlsx`;
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
    const workbook = await ExcelGenerator.generateMaterialTemplate();
    
    const fileName = '原料导入模板.xlsx';
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

module.exports = {
  getAllMaterials,
  getMaterialsByManufacturer,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  importMaterials,
  exportMaterials,
  downloadTemplate
};
