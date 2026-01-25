/**
 * 原料路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const materialController = require('../controllers/master/materialController');
const { verifyToken } = require('../middleware/auth');
const { isPurchaser } = require('../middleware/roleCheck');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('只支持 Excel 文件'));
    }
    cb(null, true);
  }
});

// 所有路由都需要认证
router.use(verifyToken);

// 获取所有原料
router.get('/', materialController.getAllMaterials);

// 批量获取原料
router.get('/batch', materialController.getMaterialsByIds);

// 获取所有类别（动态从数据库读取）
router.get('/categories', materialController.getCategories);

// 获取原料分类结构（树形）
router.get('/structure', materialController.getCategoryStructure);

// 根据厂商获取原料
router.get('/manufacturer/:manufacturer', materialController.getMaterialsByManufacturer);

// 获取单个原料
router.get('/:id', materialController.getMaterialById);

// 以下路由需要采购权限
router.post('/', isPurchaser, materialController.createMaterial);
router.post('/batch-delete', isPurchaser, materialController.batchDeleteMaterials);
router.put('/:id', isPurchaser, materialController.updateMaterial);
router.delete('/:id', isPurchaser, materialController.deleteMaterial);

// 检查品号或创建原料
router.post('/check-or-create', isPurchaser, materialController.checkOrCreate);

// Excel 导入导出
router.post('/import', isPurchaser, upload.single('file'), materialController.importMaterials);
router.post('/import/precheck', isPurchaser, upload.single('file'), materialController.preCheckImport);
router.post('/import/confirm', isPurchaser, materialController.confirmImport);
router.post('/export/excel', isPurchaser, materialController.exportMaterials);
router.get('/template/download', isPurchaser, materialController.downloadTemplate);

module.exports = router;
