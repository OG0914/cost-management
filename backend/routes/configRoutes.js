/**
 * 系统配置路由
 */

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// 所有配置路由都需要认证
router.use(verifyToken);

// 获取所有配置（所有角色可访问）
router.get('/', configController.getAllConfigs);

// 获取计算器配置（所有角色可访问）
router.get('/calculator', configController.getCalculatorConfig);

// 获取单个配置（所有角色可访问）
router.get('/:key', configController.getConfigByKey);

// 以下路由仅管理员可访问
router.put('/:key', checkRole('admin'), configController.updateConfig);
router.post('/batch', checkRole('admin'), configController.batchUpdateConfigs);
router.post('/', checkRole('admin'), configController.createConfig);
router.delete('/:key', checkRole('admin'), configController.deleteConfig);

module.exports = router;
