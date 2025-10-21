/**
 * 工序管理路由
 */

const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// 所有路由都需要认证
router.use(verifyToken);

// 包装配置路由
router.get('/packaging-configs', processController.getAllPackagingConfigs);
router.get('/packaging-configs/model/:modelId', processController.getPackagingConfigsByModel);
router.get('/packaging-configs/:id', processController.getPackagingConfigDetail);
router.post('/packaging-configs', checkRole('admin', 'producer'), processController.createPackagingConfig);
router.put('/packaging-configs/:id', checkRole('admin', 'producer'), processController.updatePackagingConfig);
router.delete('/packaging-configs/:id', checkRole('admin', 'producer'), processController.deletePackagingConfig);

// 工序配置路由
router.get('/process-configs/:packagingConfigId', processController.getProcessConfigs);
router.post('/process-configs', checkRole('admin', 'producer'), processController.createProcessConfig);
router.put('/process-configs/:id', checkRole('admin', 'producer'), processController.updateProcessConfig);
router.delete('/process-configs/:id', checkRole('admin', 'producer'), processController.deleteProcessConfig);

module.exports = router;
