/**
 * 审核管理路由
 * 处理报价单审核相关的API请求
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');

// 所有审核接口都需要认证
router.use(verifyToken);

// 审核列表接口 - 管理员、审核人员和业务员可访问（业务员只能看自己的）
router.get('/pending', requireRole(['admin', 'reviewer', 'salesperson']), reviewController.getPendingList);
router.get('/approved', requireRole(['admin', 'reviewer', 'salesperson']), reviewController.getApprovedList);

// 审核详情 - 管理员、审核人员和业务员可访问（业务员只能看自己的）
router.get('/:id/detail', requireRole(['admin', 'reviewer', 'salesperson']), reviewController.getReviewDetail);

// 审核操作 - 仅审核人和管理员可操作
router.post('/:id/approve', requireRole(['admin', 'reviewer']), reviewController.approveQuotation);
router.post('/:id/reject', requireRole(['admin', 'reviewer']), reviewController.rejectQuotation);

// 重新提交 - 业务员和管理员可操作
router.post('/:id/resubmit', requireRole(['admin', 'salesperson']), reviewController.resubmitQuotation);

// 删除报价单 - 仅管理员可操作
router.delete('/:id', requireRole(['admin']), reviewController.deleteQuotation);

module.exports = router;
