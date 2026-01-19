/** BOM控制器 - 处理产品BOM的CRUD操作 */

const ExcelJS = require('exceljs');
const ModelBom = require('../../models/ModelBom');
const Model = require('../../models/Model');
const Material = require('../../models/Material');
const { success, error } = require('../../utils/response');
const { matchCategoryFromDB } = require('../../utils/categoryMatcher');
const logger = require('../../utils/logger');

/** 获取型号BOM清单 - GET /api/bom/:modelId */
const getBomByModelId = async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await Model.findById(modelId); // 验证型号存在
    if (!model) return res.status(404).json(error('型号不存在', 404));

    const bom = await ModelBom.findByModelId(modelId);
    res.json(success(bom, '获取BOM成功'));
  } catch (err) {
    logger.error('获取BOM失败:', err);
    res.status(500).json(error('获取BOM失败: ' + err.message, 500));
  }
};

/** 添加原料到BOM - POST /api/bom */
const createBomItem = async (req, res) => {
  try {
    const { model_id, material_id, usage_amount, sort_order } = req.body;

    if (!model_id || !material_id || !usage_amount) { // 参数验证
      return res.status(400).json(error('缺少必填字段', 400));
    }
    if (usage_amount <= 0) return res.status(400).json(error('用量必须大于0', 400));

    const model = await Model.findById(model_id); // 验证型号存在
    if (!model) return res.status(404).json(error('型号不存在', 404));

    const material = await Material.findById(material_id); // 验证原料存在
    if (!material) return res.status(404).json(error('原料不存在', 404));

    const exists = await ModelBom.existsInModel(model_id, material_id); // 检查重复
    if (exists) return res.status(400).json(error('该原料已添加到BOM中', 400));

    const id = await ModelBom.create({ model_id, material_id, usage_amount, sort_order });
    const bom = await ModelBom.findByModelId(model_id); // 返回完整BOM
    res.status(201).json(success(bom, '添加成功'));
  } catch (err) {
    logger.error('添加BOM原料失败:', err);
    res.status(500).json(error('添加失败: ' + err.message, 500));
  }
};

/** 更新BOM原料项 - PUT /api/bom/:id */
const updateBomItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { usage_amount, sort_order, is_active } = req.body;

    const bomItem = await ModelBom.findById(id);
    if (!bomItem) return res.status(404).json(error('BOM记录不存在', 404));

    if (usage_amount !== undefined && usage_amount <= 0) {
      return res.status(400).json(error('用量必须大于0', 400));
    }

    await ModelBom.update(id, { usage_amount, sort_order, is_active });
    const bom = await ModelBom.findByModelId(bomItem.model_id);
    res.json(success(bom, '更新成功'));
  } catch (err) {
    logger.error('更新BOM原料失败:', err);
    res.status(500).json(error('更新失败: ' + err.message, 500));
  }
};

/** 删除BOM原料项 - DELETE /api/bom/:id */
const deleteBomItem = async (req, res) => {
  try {
    const { id } = req.params;
    const bomItem = await ModelBom.findById(id);
    if (!bomItem) return res.status(404).json(error('BOM记录不存在', 404));

    await ModelBom.delete(id);
    const bom = await ModelBom.findByModelId(bomItem.model_id);
    res.json(success(bom, '删除成功'));
  } catch (err) {
    logger.error('删除BOM原料失败:', err);
    res.status(500).json(error('删除失败: ' + err.message, 500));
  }
};

/** 批量更新BOM - PUT /api/bom/batch/:modelId */
const batchUpdateBom = async (req, res) => {
  try {
    const { modelId } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json(error('items必须是数组', 400));
    }

    for (const item of items) { // 验证用量
      if (item.usage_amount !== undefined && item.usage_amount <= 0) {
        return res.status(400).json(error('用量必须大于0', 400));
      }
    }

    await ModelBom.batchUpdate(modelId, items);
    const bom = await ModelBom.findByModelId(modelId);
    res.json(success(bom, '批量更新成功'));
  } catch (err) {
    logger.error('批量更新BOM失败:', err);
    res.status(500).json(error('批量更新失败: ' + err.message, 500));
  }
};

/** 复制BOM - POST /api/bom/copy */
const copyBom = async (req, res) => {
  try {
    const { source_model_id, target_model_id, mode = 'replace' } = req.body;

    if (!source_model_id || !target_model_id) { // 参数验证
      return res.status(400).json(error('缺少源型号或目标型号', 400));
    }
    if (source_model_id === target_model_id) {
      return res.status(400).json(error('源型号和目标型号不能相同', 400));
    }
    if (!['replace', 'merge'].includes(mode)) {
      return res.status(400).json(error('无效的复制模式', 400));
    }

    const sourceModel = await Model.findById(source_model_id); // 验证型号存在
    if (!sourceModel) return res.status(404).json(error('源型号不存在', 404));
    const targetModel = await Model.findById(target_model_id);
    if (!targetModel) return res.status(404).json(error('目标型号不存在', 404));

    const result = await ModelBom.copyBom(source_model_id, target_model_id, mode);
    const bom = await ModelBom.findByModelId(target_model_id); // 返回复制后的BOM
    res.json(success({ ...result, bom }, `复制成功：${result.copiedCount}项${result.skippedCount > 0 ? `，跳过${result.skippedCount}项` : ''}`));
  } catch (err) {
    logger.error('复制BOM失败:', err);
    res.status(500).json(error('复制失败: ' + err.message, 500));
  }
};

/** 从Excel导入BOM - POST /api/bom/import */
const importBom = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json(error('请上传文件', 400));

    const { model_id, mode = 'replace' } = req.body;
    if (!model_id) return res.status(400).json(error('请指定目标型号', 400));

    const model = await Model.findById(model_id);
    if (!model) return res.status(404).json(error('型号不存在', 404));

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    if (!ws) return res.status(400).json(error('Excel文件为空', 400));

    // 解析Excel数据：母件品號, 展開用料, 本地品名, 單位用量, 庫存單位, 主要廠商
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return; // 跳过表头
      const [parentCode, childCode, childName, usageAmount, unit, vendor] = row.values.slice(1);
      if (parentCode && childCode && usageAmount) {
        rows.push({ parentCode: String(parentCode).trim(), childCode: String(childCode).trim(), childName: String(childName || '').trim(), usageAmount: parseFloat(usageAmount) || 0, unit: String(unit || '').trim(), vendor: String(vendor || '').trim() });
      }
    });

    if (rows.length === 0) return res.status(400).json(error('未找到有效BOM数据', 400));

    // 构建BOM树，找出顶层型号和最底层原料
    const childToParent = new Map(); // 子件 -> 父件列表
    const hasChildren = new Set(); // 有子件的料号
    rows.forEach(r => {
      if (!childToParent.has(r.childCode)) childToParent.set(r.childCode, []);
      childToParent.get(r.childCode).push(r);
      hasChildren.add(r.parentCode);
    });

    // 底层原料 = 没有子件的料号
    const leafMaterials = new Set();
    rows.forEach(r => { if (!hasChildren.has(r.childCode)) leafMaterials.add(r.childCode); });

    // 递归计算顶层型号到底层原料的用量
    const bomMap = new Map(); // childCode -> { usageAmount, childName, unit, vendor }
    const visited = new Set();
    
    const calcUsage = (code, multiplier = 1) => {
      if (visited.has(code)) return; // 防止循环
      visited.add(code);
      
      const children = rows.filter(r => r.parentCode === code);
      for (const child of children) {
        const totalUsage = child.usageAmount * multiplier;
        if (leafMaterials.has(child.childCode)) {
          // 底层原料，累加用量
          if (bomMap.has(child.childCode)) {
            bomMap.get(child.childCode).usageAmount += totalUsage;
          } else {
            bomMap.set(child.childCode, { usageAmount: totalUsage, childName: child.childName, unit: child.unit, vendor: child.vendor });
          }
        } else {
          // 中间件，继续展开
          calcUsage(child.childCode, totalUsage);
        }
      }
      visited.delete(code);
    };

    // 找到顶层型号（没有父件的料号）
    const allChildCodes = new Set(rows.map(r => r.childCode));
    const topLevelCodes = [...new Set(rows.map(r => r.parentCode))].filter(p => !allChildCodes.has(p));
    
    if (topLevelCodes.length === 0) return res.status(400).json(error('未找到顶层型号', 400));
    
    // 从顶层开始计算
    topLevelCodes.forEach(code => calcUsage(code, 1));

    // 匹配系统中的原料（按item_no匹配）
    const materialCodes = [...bomMap.keys()];
    const existingMaterials = await Material.findByItemNos(materialCodes);
    const materialMap = new Map(existingMaterials.map(m => [m.item_no, m]));

    // 自动创建不存在的原料（含类别识别）
    let materialsCreated = 0;
    for (const [itemNo, data] of bomMap) {
      if (!materialMap.has(itemNo)) {
        const materialName = data.childName || itemNo;
        const category = await matchCategoryFromDB(materialName); // 自动识别类别
        const newMaterial = await Material.create({
          item_no: itemNo,
          name: materialName,
          unit: data.unit || 'PCS',
          price: 0,
          currency: 'CNY',
          manufacturer: data.vendor || null,
          category
        });
        materialMap.set(itemNo, { id: newMaterial, item_no: itemNo, name: materialName, unit: data.unit, category });
        materialsCreated++;
      }
    }

    // 执行导入
    const result = await ModelBom.importBom(model_id, bomMap, materialMap, mode);
    const bom = await ModelBom.findByModelId(model_id);

    res.json(success({
      ...result,
      materialsCreated,
      topLevelCodes,
      leafCount: leafMaterials.size,
      bom
    }, `导入成功：BOM ${result.created}项新增，${result.updated}项更新${materialsCreated > 0 ? `，自动创建原料${materialsCreated}项` : ''}`));
  } catch (err) {
    logger.error('导入BOM失败:', err);
    res.status(500).json(error('导入失败: ' + err.message, 500));
  }
};

/** 下载BOM导入模板 - GET /api/bom/template/download */
const downloadTemplate = async (req, res) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('BOM模板');
    
    ws.columns = [
      { header: '母件品號', key: 'parentCode', width: 20 },
      { header: '展開用料', key: 'childCode', width: 20 },
      { header: '本地品名', key: 'childName', width: 40 },
      { header: '單位用量', key: 'usageAmount', width: 12 },
      { header: '庫存單位', key: 'unit', width: 10 },
      { header: '主要廠商', key: 'vendor', width: 15 }
    ];

    // 添加示例数据
    ws.addRow({ parentCode: 'MODEL-001', childCode: 'MAT-001', childName: '原料A', usageAmount: 0.5, unit: 'KG', vendor: '' });
    ws.addRow({ parentCode: 'MODEL-001', childCode: 'MAT-002', childName: '原料B', usageAmount: 1, unit: 'PCS', vendor: 'VS001' });

    // 设置表头样式
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BOM_Template.xlsx');
    await wb.xlsx.write(res);
  } catch (err) {
    logger.error('下载模板失败:', err);
    res.status(500).json(error('下载失败: ' + err.message, 500));
  }
};

module.exports = { getBomByModelId, createBomItem, updateBomItem, deleteBomItem, batchUpdateBom, copyBom, importBom, downloadTemplate };
