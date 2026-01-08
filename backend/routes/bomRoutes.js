/** BOM路由 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const bomController = require('../controllers/master/bomController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(verifyToken); // 所有路由需要认证

router.get('/template/download', bomController.downloadTemplate); // 下载导入模板
router.get('/:modelId', bomController.getBomByModelId); // 获取型号BOM
router.post('/import', isAdmin, upload.single('file'), bomController.importBom); // 导入BOM（仅管理员）
router.post('/copy', isAdmin, bomController.copyBom); // 复制BOM（仅管理员）
router.post('/', isAdmin, bomController.createBomItem); // 添加BOM原料（仅管理员）
router.put('/batch/:modelId', isAdmin, bomController.batchUpdateBom); // 批量更新（仅管理员）
router.put('/:id', isAdmin, bomController.updateBomItem); // 更新BOM原料（仅管理员）
router.delete('/:id', isAdmin, bomController.deleteBomItem); // 删除BOM原料（仅管理员）

module.exports = router;
