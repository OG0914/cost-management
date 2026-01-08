/**
 * 法规类别路由
 */

const express = require('express');
const router = express.Router();
const regulationController = require('../controllers/master/regulationController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// 所有路由都需要认证
router.use(verifyToken);

// 获取所有法规类别
router.get('/', regulationController.getAllRegulations);

// 获取激活的法规类别
router.get('/active', regulationController.getActiveRegulations);

// 获取单个法规类别
router.get('/:id', regulationController.getRegulationById);

// 以下路由管理员、采购、生产可访问
router.post('/', checkRole('admin', 'purchaser', 'producer'), regulationController.createRegulation);
router.put('/:id', checkRole('admin', 'purchaser', 'producer'), regulationController.updateRegulation);
router.delete('/:id', checkRole('admin', 'purchaser', 'producer'), regulationController.deleteRegulation);

module.exports = router;
