/**
 * 原料查询控制器
 */

const logger = require('../../utils/logger');
const Material = require('../../models/Material');
const { success, error } = require('../../utils/response');
const dbManager = require('../../db/database');
const { matchCategoryFromDB } = require('../../utils/categoryMatcher');

// 批量获取原料（根据ID列表）
const getMaterialsByIds = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.json(success([]));
    }

    const idArray = (Array.isArray(ids) ? ids : ids.split(',')).map(id => parseInt(id)).filter(id => !isNaN(id));
    if (idArray.length === 0) {
      return res.json(success([]));
    }

    // 使用批量SQL查询代替逐个查询，提升性能
    const placeholders = idArray.map((_, i) => `$${i + 1}`).join(', ');
    const result = await dbManager.query(
      `SELECT * FROM materials WHERE id IN (${placeholders}) ORDER BY id`,
      idArray
    );

    res.json(success(result.rows));
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

// 获取所有类别（去重）
const getCategories = async (req, res, next) => {
  try {
    const result = await dbManager.query(`SELECT DISTINCT category FROM materials WHERE category IS NOT NULL AND category != '' ORDER BY category`);
    const categories = result.rows.map(row => row.category);
    res.json(success(categories));
  } catch (err) {
    next(err);
  }
};

// 获取原料分类结构（用于前端生成侧边栏树）
const getCategoryStructure = async (req, res, next) => {
  try {
    // 获取所有非空的类型和子分类
    const result = await dbManager.query(`
      SELECT DISTINCT material_type, subcategory
      FROM materials
      WHERE material_type IS NOT NULL
      ORDER BY material_type, subcategory
    `);

    // 组装成树形结构
    const structure = {
      half_mask: [], // 半面罩类
      general: []    // 口罩类/其他
    };

    result.rows.forEach(row => {
      const type = row.material_type === 'half_mask' ? 'half_mask' : 'general';
      if (row.subcategory && !structure[type].includes(row.subcategory)) {
        structure[type].push(row.subcategory);
      }
    });

    res.json(success(structure));
  } catch (err) { next(err); }
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

module.exports = {
  getMaterialsByIds,
  getMaterialsByManufacturer,
  getMaterialById,
  getCategories,
  getCategoryStructure,
  checkOrCreate
};
