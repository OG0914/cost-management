/**
 * 型号路由
 */

const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// 所有路由都需要认证
router.use(verifyToken);

// 获取所有型号
router.get('/', modelController.getAllModels);

// 获取激活的型号
router.get('/active', modelController.getActiveModels);

// 根据法规 ID 获取型号
router.get('/regulation/:regulationId', modelController.getModelsByRegulation);

// 获取单个型号
router.get('/:id', modelController.getModelById);

// 以下路由仅管理员可访问
router.post('/', isAdmin, modelController.createModel);
router.put('/:id', isAdmin, modelController.updateModel);
router.delete('/:id', isAdmin, modelController.deleteModel);

module.exports = router;
