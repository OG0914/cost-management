/**
 * 成本报价路由
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const costController = require('../controllers/costController');

// 所有路由都需要认证
router.use(verifyToken);

/**
 * 报价单管理路由
 */

// 获取报价单列表
// 权限：所有登录用户（业务员只能看自己的，管理员和审核人可以看所有）
router.get('/quotations', costController.getQuotationList);

// 获取报价单详情
// 权限：创建者、管理员、审核人
router.get('/quotations/:id', costController.getQuotationDetail);

// 创建报价单
// 权限：业务员、管理员
router.post(
  '/quotations',
  checkRole('salesperson', 'admin'),
  costController.createQuotation
);

// 更新报价单
// 权限：创建者或管理员
router.put('/quotations/:id', costController.updateQuotation);

// 删除报价单
// 权限：创建者或管理员
router.delete('/quotations/:id', costController.deleteQuotation);

// 提交报价单
// 权限：创建者或管理员
router.post('/quotations/:id/submit', costController.submitQuotation);

/**
 * 辅助功能路由
 */

// 获取型号标准数据
// 权限：所有登录用户
router.get('/models/:modelId/standard-data', costController.getModelStandardData);

// 计算报价（不保存）
// 权限：所有登录用户
router.post('/calculate', costController.calculateQuotation);

module.exports = router;
