/**
 * 原料CRUD控制器
 */

const logger = require('../../utils/logger');
const Material = require('../../models/Material');
const ModelBom = require('../../models/ModelBom');
const QuotationItem = require('../../models/QuotationItem');
const { success, error, paginated } = require('../../utils/response');
const QueryBuilder = require('../../utils/queryBuilder');
const dbManager = require('../../db/database');

/**
 * 获取原料列表（支持分页和搜索）
 * GET /api/materials
 * @query {number} page - 页码，默认 1
 * @query {number} pageSize - 每页条数，默认 20，最大 100
 * @query {string} keyword - 搜索关键词（匹配品号或原料名称）
 */
const getAllMaterials = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, category, material_type, subcategory } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    const query = new QueryBuilder('materials');

    if (keyword && keyword.trim()) {
      query.whereLikeOr(['item_no', 'name', 'manufacturer', 'supplier'], keyword);
    }

    // 兼容旧版 category (如果前端还在传)
    if (category && category.trim()) query.where('category', '=', category.trim());

    // 新增筛选
    if (material_type && material_type.trim()) query.where('material_type', '=', material_type.trim());
    if (subcategory && subcategory.trim()) query.where('subcategory', '=', subcategory.trim());

    query.orderByDesc('updated_at');

    const countResult = query.clone().buildCount();
    const countData = await dbManager.query(countResult.sql, countResult.params);
    const total = parseInt(countData.rows[0].total);

    query.limit(pageSizeNum).offset(offset);
    const selectResult = query.buildSelect();
    const data = await dbManager.query(selectResult.sql, selectResult.params);

    res.json(paginated(data.rows, total, pageNum, pageSizeNum));
  } catch (err) { next(err); }
};

// 创建原料
const createMaterial = async (req, res, next) => {
  try {
    const { item_no, name, unit, price, currency, manufacturer, usage_amount, category, material_type, subcategory, product_desc, packaging_mode, supplier, production_date, production_cycle, moq, remark } = req.body;

    if (!item_no || !name || !unit || price === undefined || price === null || price === '') {
      return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));
    }

    const existing = await Material.findByItemNo(item_no); // 检查品号唯一性
    if (existing) return res.status(400).json(error('品号已存在', 400));

    const id = await Material.create({ item_no, name, unit, price, currency, manufacturer, usage_amount, category, material_type, subcategory, product_desc, packaging_mode, supplier, production_date, production_cycle, moq, remark });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) { next(err); }
};

// 更新原料
const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_no, name, unit, price, currency, manufacturer, usage_amount, category, material_type, subcategory, product_desc, packaging_mode, supplier, production_date, production_cycle, moq, remark } = req.body;

    const material = await Material.findById(id);
    if (!material) return res.status(404).json(error('原料不存在', 404));
    if (!item_no || !name || !unit || price === undefined || price === null || price === '') return res.status(400).json(error('品号、原料名称、单位和单价不能为空', 400));

    await Material.update(id, { item_no, name, unit, price, currency, manufacturer, usage_amount, category, material_type, subcategory, product_desc, packaging_mode, supplier, production_date, production_cycle, moq, remark }, req.user?.id);
    res.json(success(null, '更新成功'));
  } catch (err) { next(err); }
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

// 批量删除原料（检查每个是否可删除）
const batchDeleteMaterials = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(error('请提供要删除的原料ID', 400));
    }

    const results = { deleted: 0, failed: [], skipped: [] };

    for (const id of ids) {
      const material = await Material.findById(id);
      if (!material) { results.skipped.push({ id, reason: '不存在' }); continue; }

      // 检查 BOM 引用
      const isUsedInBom = await ModelBom.isMaterialUsed(id);
      if (isUsedInBom) {
        const models = await ModelBom.getModelsByMaterial(id);
        results.failed.push({ id, name: material.name, reason: `被型号引用: ${models.map(m => m.model_name).slice(0, 3).join('、')}` });
        continue;
      }

      // 检查报价单引用
      const isUsedInQuotation = await QuotationItem.isMaterialUsed(id);
      if (isUsedInQuotation) {
        const quotations = await QuotationItem.getQuotationsByMaterial(id);
        results.failed.push({ id, name: material.name, reason: `被报价单引用: ${quotations.slice(0, 3).map(q => q.quotation_no).join('、')}` });
        continue;
      }

      await Material.delete(id);
      results.deleted++;
    }

    const msg = results.deleted > 0 ? `成功删除 ${results.deleted} 条` : '无可删除项';
    res.json(success(results, msg));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  batchDeleteMaterials
};
