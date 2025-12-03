/**
 * 型号路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const modelController = require('../controllers/modelController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `model_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// 所有路由都需要认证
router.use(verifyToken);

// 获取所有型号（支持 model_category 和 regulation_id 查询参数过滤）
router.get('/', modelController.getAllModels);

// 获取所有型号分类
router.get('/categories', modelController.getModelCategories);

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

// 导入导出功能（仅管理员）
router.post('/import', isAdmin, upload.single('file'), modelController.importModels);
router.post('/export/excel', isAdmin, modelController.exportModels);
router.get('/template/download', isAdmin, modelController.downloadTemplate);

module.exports = router;
