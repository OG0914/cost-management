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
 * 权限：仅管理员、审核人、业务员可以访问，采购人员和生产人员禁止访问
 */

// 获取报价单列表
// 权限：管理员、审核人、业务员（业务员只能看自己的）
router.get('/quotations', checkRole('admin', 'reviewer', 'salesperson'), costController.getQuotationList);

// 获取报价单详情
// 权限：管理员、审核人、业务员（业务员只能看自己的或标准成本关联的）
router.get('/quotations/:id', checkRole('admin', 'reviewer', 'salesperson'), costController.getQuotationDetail);

// 创建报价单
// 权限：业务员、管理员、审核人
router.post(
  '/quotations',
  checkRole('salesperson', 'admin', 'reviewer'),
  costController.createQuotation
);

// 更新报价单
// 权限：管理员、审核人、业务员（创建者）
router.put('/quotations/:id', checkRole('admin', 'reviewer', 'salesperson'), costController.updateQuotation);

// 删除报价单
// 权限：管理员、审核人、业务员（创建者）
router.delete('/quotations/:id', checkRole('admin', 'reviewer', 'salesperson'), costController.deleteQuotation);

// 提交报价单
// 权限：管理员、审核人、业务员（创建者）
router.post('/quotations/:id/submit', checkRole('admin', 'reviewer', 'salesperson'), costController.submitQuotation);

/**
 * 辅助功能路由
 */

// 获取型号标准数据（旧接口，保留兼容）
// 权限：所有登录用户
router.get('/models/:modelId/standard-data', costController.getModelStandardData);

// 获取所有包装配置列表
// 权限：所有登录用户
router.get('/packaging-configs', costController.getPackagingConfigs);

// 获取包装配置详情（包含工序和包材）
// 权限：所有登录用户
router.get('/packaging-configs/:configId/details', costController.getPackagingConfigDetails);

// 计算报价（不保存）
// 权限：所有登录用户
router.post('/calculate', costController.calculateQuotation);

// 获取原料系数配置
// 权限：所有登录用户
router.get('/material-coefficients', costController.getMaterialCoefficients);

module.exports = router;
