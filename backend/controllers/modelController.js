/**
 * 型号控制器
 */

const Model = require('../models/Model');
const { success, error } = require('../utils/response');

// 获取所有型号
const getAllModels = (req, res, next) => {
  try {
    const models = Model.findAll();
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 获取激活的型号
const getActiveModels = (req, res, next) => {
  try {
    const models = Model.findActive();
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 根据法规 ID 获取型号
const getModelsByRegulation = (req, res, next) => {
  try {
    const { regulationId } = req.params;
    const models = Model.findByRegulationId(regulationId);
    res.json(success(models));
  } catch (err) {
    next(err);
  }
};

// 根据 ID 获取型号
const getModelById = (req, res, next) => {
  try {
    const { id } = req.params;
    const model = Model.findById(id);
    
    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }
    
    res.json(success(model));
  } catch (err) {
    next(err);
  }
};

// 创建型号
const createModel = (req, res, next) => {
  try {
    const { regulation_id, model_name, remark } = req.body;
    
    if (!regulation_id || !model_name) {
      return res.status(400).json(error('法规类别和型号名称不能为空', 400));
    }
    
    const id = Model.create({ regulation_id, model_name, remark });
    res.status(201).json(success({ id }, '创建成功'));
  } catch (err) {
    next(err);
  }
};

// 更新型号
const updateModel = (req, res, next) => {
  try {
    const { id } = req.params;
    const { regulation_id, model_name, remark, is_active } = req.body;
    
    const model = Model.findById(id);
    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }
    
    if (!regulation_id || !model_name) {
      return res.status(400).json(error('法规类别和型号名称不能为空', 400));
    }
    
    Model.update(id, { regulation_id, model_name, remark, is_active: is_active !== undefined ? is_active : 1 });
    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除型号
const deleteModel = (req, res, next) => {
  try {
    const { id } = req.params;
    
    const model = Model.findById(id);
    if (!model) {
      return res.status(404).json(error('型号不存在', 404));
    }
    
    // 检查是否被报价单使用
    if (Model.isUsedInQuotations(id)) {
      return res.status(400).json(error('该型号已被报价单使用，无法删除', 400));
    }
    
    Model.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllModels,
  getActiveModels,
  getModelsByRegulation,
  getModelById,
  createModel,
  updateModel,
  deleteModel
};
