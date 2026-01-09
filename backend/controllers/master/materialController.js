/**
 * 原料控制器
 */

const logger = require('../../utils/logger');
const Material = require('../../models/Material');
const ModelBom = require('../../models/ModelBom');
const QuotationItem = require('../../models/QuotationItem');
const ExcelParser = require('../../utils/excelParser');
const ExcelGenerator = require('../../utils/excel');
const { success, error, paginated } = require('../../utils/response');
const QueryBuilder = require('../../utils/queryBuilder');
const dbManager = require('../../db/database');
const { matchCategoryFromDB } = require('../../utils/categoryMatcher');
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
    const { page = 1, pageSize = 20, keyword, category } = req.query;
    
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
    
    // 类别筛选
    if (category && category.trim()) {
      query.where('category', category.trim());
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
    const { item_no, name, unit, price, currency, manufacturer, usage_amount, category } = req.body;
    
    if (!item_no || !name || !unit || !price) {
      return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));
    }
    
    const id = await Material.create({ item_no, name, unit, price, currency, manufacturer, usage_amount, category });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新原料
const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_no, name, unit, price, currency, manufacturer, usage_amount, category } = req.body;
    
    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json(error('原料不存在', 404));
    }
    
    if (!item_no || !name || !unit || !price) {
      return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));
    }
    
    await Material.update(id, { item_no, name, unit, price, currency, manufacturer, usage_amount, category }, req.user?.id);
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
    
    // 检查是否被BOM引用
    const isUsedInBom = await ModelBom.isMaterialUsed(id);
    if (isUsedInBom) {
      const models = await ModelBom.getModelsByMaterial(id);
      const modelNames = models.map(m => m.model_name).join('、');
      return res.status(400).json(error(`该原料已被以下型号BOM引用：${modelNames}，无法删除`, 400));
    }
    
    // 检查是否被报价单明细引用
    const isUsedInQuotation = await QuotationItem.isMaterialUsed(id);
    if (isUsedInQuotation) {
      const quotations = await QuotationItem.getQuotationsByMaterial(id);
      const quotationNos = quotations.slice(0, 5).map(q => q.quotation_no).join('、');
      const suffix = quotations.length > 5 ? `等${quotations.length}个报价单` : '';
      return res.status(400).json(error(`该原料已被报价单引用：${quotationNos}${suffix}，无法删除`, 400));
    }
    
    await Material.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// 临时文件存储（用于两阶段导入）
const pendingImports = new Map(); // importId -> { filePath, expireAt }

// 清理过期的临时文件
const cleanupExpiredImports = () => {
  const now = Date.now();
  for (const [id, data] of pendingImports) {
    if (now > data.expireAt) {
      if (fs.existsSync(data.filePath)) fs.unlinkSync(data.filePath);
      pendingImports.delete(id);
    }
  }
};

// 预检查导入原料（返回重复品号）
const preCheckImport = async (req, res, next) => {
  try {
    cleanupExpiredImports(); // 清理过期文件
    if (!req.file) return res.status(400).json(error('请上传文件', 400));
    
    const filePath = req.file.path;
    const result = await ExcelParser.parseMaterialExcel(filePath);
    
    if (!result.success) {
      fs.unlinkSync(filePath);
      return res.status(400).json(error('文件解析失败', 400, result.errors));
    }
    
    // 检查重复品号
    const duplicates = [];
    for (const material of result.data) {
      const existing = await Material.findByItemNo(material.item_no);
      if (existing) {
        duplicates.push({ item_no: material.item_no, name: material.name, existing_name: existing.name });
      }
    }
    
    // 生成临时导入ID，5分钟过期
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    pendingImports.set(importId, { filePath, expireAt: Date.now() + 5 * 60 * 1000 });
    
    res.json(success({
      total: result.total,
      valid: result.valid,
      duplicates,
      importId // 返回导入ID而非文件路径
    }));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

// 确认导入原料
const confirmImport = async (req, res, next) => {
  try {
    const { importId, mode = 'skip' } = req.body; // mode: skip(跳过) / update(更新)
    
    // 验证导入ID
    const importData = pendingImports.get(importId);
    if (!importData || Date.now() > importData.expireAt) {
      if (importData) pendingImports.delete(importId);
      return res.status(400).json(error('导入已过期，请重新上传文件', 400));
    }
    
    const filePath = importData.filePath;
    if (!fs.existsSync(filePath)) {
      pendingImports.delete(importId);
      return res.status(400).json(error('文件不存在，请重新上传', 400));
    }
    
    const result = await ExcelParser.parseMaterialExcel(filePath);
    fs.unlinkSync(filePath); // 删除临时文件
    pendingImports.delete(importId);
    
    if (!result.success) return res.status(400).json(error('文件解析失败', 400));
    
    let created = 0, updated = 0, skipped = 0;
    
    for (const material of result.data) {
      const existing = await Material.findByItemNo(material.item_no);
      
      // 自动识别类别（如果Excel未填）
      if (!material.category) {
        material.category = await matchCategoryFromDB(material.name);
      }
      
      if (existing) {
        if (mode === 'update') {
          await Material.update(existing.id, material);
          updated++;
        } else {
          skipped++;
        }
      } else {
        await Material.create(material);
        created++;
      }
    }
    
    res.json(success({ total: result.total, created, updated, skipped }, '导入成功'));
  } catch (err) {
    next(err);
  }
};

// 导入原料 Excel（兼容旧接口，无重复时直接导入）
const importMaterials = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json(error('请上传文件', 400));
    
    const filePath = req.file.path;
    const result = await ExcelParser.parseMaterialExcel(filePath);
    fs.unlinkSync(filePath);
    
    if (!result.success) return res.status(400).json(error('文件解析失败', 400, result.errors));
    
    // 检查重复品号
    const duplicates = [];
    for (const material of result.data) {
      const existing = await Material.findByItemNo(material.item_no);
      if (existing) duplicates.push({ item_no: material.item_no, name: material.name, existing_name: existing.name });
    }
    
    // 如果有重复，返回让前端确认（前端需要重新上传并使用两阶段导入）
    if (duplicates.length > 0) {
      return res.json(success({ needConfirm: true, duplicates, total: result.total, valid: result.valid }, '发现重复品号，请确认处理方式'));
    }
    
    // 无重复，直接导入
    let created = 0;
    for (const material of result.data) {
      if (!material.category) material.category = await matchCategoryFromDB(material.name);
      await Material.create(material);
      created++;
    }
    
    res.json(success({ total: result.total, valid: result.valid, created, updated: 0 }, '导入成功'));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

// 检查品号或创建原料
const checkOrCreate = async (req, res, next) => {
  try {
    const { item_no, name, unit, price, currency, manufacturer } = req.body;
    
    if (!item_no) return res.status(400).json(error('品号不能为空', 400));
    
    // 检查是否存在
    const existing = await Material.findByItemNo(item_no);
    if (existing) {
      return res.json(success({ exists: true, material: existing }));
    }
    
    // 不存在，如果提供了完整信息则创建
    if (name && unit && price !== undefined) {
      const category = await matchCategoryFromDB(name);
      const id = await Material.create({ item_no, name, unit, price: price || 0, currency: currency || 'CNY', manufacturer, category });
      const newMaterial = await Material.findById(id);
      return res.status(201).json(success({ exists: false, created: true, material: newMaterial }, '原料创建成功'));
    }
    
    // 不存在且未提供完整信息
    res.json(success({ exists: false, created: false }));
  } catch (err) {
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
  preCheckImport,
  confirmImport,
  checkOrCreate,
  exportMaterials,
  downloadTemplate
};
