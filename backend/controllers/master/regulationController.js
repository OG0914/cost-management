/**
 * 法规类别控制器
 */

const Regulation = require('../../models/Regulation');
const { success, error } = require('../../utils/response');

// 获取所有法规类别
const getAllRegulations = async (req, res, next) => {
  try {
    const regulations = await Regulation.findAll();
    res.json(success(regulations));
  } catch (err) {
    next(err);
  }
};

// 获取激活的法规类别
const getActiveRegulations = async (req, res, next) => {
  try {
    const regulations = await Regulation.findActive();
    res.json(success(regulations));
  } catch (err) {
    next(err);
  }
};

// 根据 ID 获取法规
const getRegulationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const regulation = await Regulation.findById(id);
    
    if (!regulation) {
      return res.status(404).json(error('法规类别不存在', 404));
    }
    
    res.json(success(regulation));
  } catch (err) {
    next(err);
  }
};

// 创建法规类别
const createRegulation = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json(error('法规名称不能为空', 400));
    }
    
    // 检查名称是否已存在
    if (await Regulation.existsByName(name)) {
      return res.status(400).json(error('法规名称已存在', 400));
    }
    
    const id = await Regulation.create({ name, description });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新法规类别
const updateRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    
    const regulation = await Regulation.findById(id);
    if (!regulation) {
      return res.status(404).json(error('法规类别不存在', 404));
    }
    
    if (!name) {
      return res.status(400).json(error('法规名称不能为空', 400));
    }
    
    // 检查名称是否与其他法规重复
    if (await Regulation.existsByName(name, id)) {
      return res.status(400).json(error('法规名称已存在', 400));
    }
    
    await Regulation.update(id, { name, description, is_active: is_active !== undefined ? is_active : 1 });
    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除法规类别
const deleteRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const regulation = await Regulation.findById(id);
    if (!regulation) {
      return res.status(404).json(error('法规类别不存在', 404));
    }
    
    await Regulation.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRegulations,
  getActiveRegulations,
  getRegulationById,
  createRegulation,
  updateRegulation,
  deleteRegulation
};
