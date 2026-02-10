/**
 * 原料导入导出控制器
 */

const logger = require('../../utils/logger');
const Material = require('../../models/Material');
const ExcelParser = require('../../utils/excelParser');
const ExcelGenerator = require('../../utils/excel');
const { success, error } = require('../../utils/response');
const { matchCategoryFromDB } = require('../../utils/categoryMatcher');
const path = require('path');
const fs = require('fs');

// 临时目录路径
const TEMP_DIR = path.join(__dirname, '../temp');

/**
 * 确保临时目录存在并返回文件完整路径
 * @param {string} fileName - 文件名
 * @returns {string} 完整文件路径
 */
const ensureTempFile = (fileName) => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return path.join(TEMP_DIR, fileName);
};

/**
 * 发送文件并在完成后删除
 * @param {Response} res - Express响应对象
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 下载文件名
 * @param {Function} next - 错误处理函数
 */
const sendAndCleanup = (res, filePath, fileName, next) => {
  res.download(filePath, fileName, (err) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (err) next(err);
  });
};

// 临时文件存储（用于两阶段导入）
const pendingImports = new Map(); // importId -> { filePath, expireAt }
const PENDING_IMPORTS_MAX_SIZE = 100; // 最大容量限制，防止内存溢出

// 清理过期的临时文件
const cleanupExpiredImports = () => {
  const now = Date.now();
  for (const [id, data] of pendingImports) {
    if (now > data.expireAt) {
      if (fs.existsSync(data.filePath)) fs.unlinkSync(data.filePath);
      pendingImports.delete(id);
    }
  }
  // 如果仍超过限制，删除最旧的条目
  if (pendingImports.size > PENDING_IMPORTS_MAX_SIZE) {
    const entries = [...pendingImports.entries()].sort((a, b) => a[1].expireAt - b[1].expireAt);
    const toDelete = entries.slice(0, pendingImports.size - PENDING_IMPORTS_MAX_SIZE);
    for (const [id, data] of toDelete) {
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

// 导出原料 Excel
const exportMaterials = async (req, res, next) => {
  try {
    const { ids } = req.body;

    let materials;
    if (ids && ids.length > 0) {
      const materialPromises = ids.map(id => Material.findById(id));
      materials = (await Promise.all(materialPromises)).filter(m => m !== null);
    } else {
      materials = await Material.findAll();
    }

    if (materials.length === 0) {
      return res.status(400).json(error('没有可导出的数据', 400));
    }

    const workbook = await ExcelGenerator.generateMaterialExcel(materials);
    const fileName = `原料清单_${Date.now()}.xlsx`;
    const filePath = ensureTempFile(fileName);

    await workbook.xlsx.writeFile(filePath);
    sendAndCleanup(res, filePath, fileName, next);
  } catch (err) {
    next(err);
  }
};

// 下载导入模板
const downloadTemplate = async (req, res, next) => {
  try {
    const { type } = req.query;
    const workbook = await ExcelGenerator.generateMaterialTemplate(type);
    const fileName = '原料导入模板.xlsx';
    const filePath = ensureTempFile(fileName);

    await workbook.xlsx.writeFile(filePath);
    sendAndCleanup(res, filePath, fileName, next);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  preCheckImport,
  confirmImport,
  importMaterials,
  exportMaterials,
  downloadTemplate
};
