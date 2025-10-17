/**
 * 法规类别路由
 */

const express = require('express');
const router = express.Router();
const regulationController = require('../controllers/regulationController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// 所有路由都需要认证
router.use(verifyToken);

// 获取所有法规类别
router.get('/', regulationController.getAllRegulations);

// 获取激活的法规类别
router.get('/active', regulationController.getActiveRegulations);

// 获取单个法规类别
router.get('/:id', regulationController.getRegulationById);

// 以下路由仅管理员可访问
router.post('/', isAdmin, regulationController.createRegulation);
router.put('/:id', isAdmin, regulationController.updateRegulation);
router.delete('/:id', isAdmin, regulationController.deleteRegulation);

module.exports = router;
