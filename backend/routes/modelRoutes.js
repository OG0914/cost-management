/**
 * 型号路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const modelController = require('../controllers/modelController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

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

// 获取所有产品系列
router.get('/series', modelController.getModelSeries);

// 获取所有型号（带BOM数量，用于BOM复制）
router.get('/with-bom-count', modelController.getModelsWithBomCount);

// 获取激活的型号
router.get('/active', modelController.getActiveModels);

// 根据法规 ID 获取型号
router.get('/regulation/:regulationId', modelController.getModelsByRegulation);

// 获取单个型号
router.get('/:id', modelController.getModelById);

// 以下路由管理员、采购、生产可访问
router.post('/', checkRole('admin', 'purchaser', 'producer'), modelController.createModel);
router.put('/:id', checkRole('admin', 'purchaser', 'producer'), modelController.updateModel);
router.delete('/:id', checkRole('admin', 'purchaser', 'producer'), modelController.deleteModel);

// 导入导出功能（管理员、采购、生产可访问）
router.post('/import', checkRole('admin', 'purchaser', 'producer'), upload.single('file'), modelController.importModels);
router.post('/export/excel', checkRole('admin', 'purchaser', 'producer'), modelController.exportModels);
router.get('/template/download', checkRole('admin', 'purchaser', 'producer'), modelController.downloadTemplate);

module.exports = router;
