/** BOM控制器 - 处理产品BOM的CRUD操作 */

const ModelBom = require('../models/ModelBom');
const Model = require('../models/Model');
const Material = require('../models/Material');
const { success, error } = require('../utils/response');

/** 获取型号BOM清单 - GET /api/bom/:modelId */
const getBomByModelId = async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await Model.findById(modelId); // 验证型号存在
    if (!model) return res.status(404).json(error('型号不存在', 404));

    const bom = await ModelBom.findByModelId(modelId);
    res.json(success(bom, '获取BOM成功'));
  } catch (err) {
    console.error('获取BOM失败:', err);
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
    console.error('添加BOM原料失败:', err);
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
    console.error('更新BOM原料失败:', err);
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
    console.error('删除BOM原料失败:', err);
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
    console.error('批量更新BOM失败:', err);
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
    console.error('复制BOM失败:', err);
    res.status(500).json(error('复制失败: ' + err.message, 500));
  }
};

module.exports = { getBomByModelId, createBomItem, updateBomItem, deleteBomItem, batchUpdateBom, copyBom };
