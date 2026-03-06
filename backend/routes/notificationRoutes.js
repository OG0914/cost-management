/**
 * 通知路由
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(verifyToken);

// 获取通知列表
router.get('/', notificationController.getNotifications);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

// 获取物料价格变更历史
router.get('/price-history/:materialId', notificationController.getPriceChangeHistory);

// 获取受价格变更影响的实体
router.get('/affected-entities/:priceChangeId', notificationController.getAffectedEntities);

// 标记通知为已读
router.put('/:id/read', notificationController.markAsRead);

// 批量标记通知为已读
router.put('/read-batch', notificationController.markAsReadBatch);

// 标记所有通知为已读
router.put('/read-all', notificationController.markAllAsRead);

// 关闭/忽略通知
router.put('/:id/dismiss', notificationController.dismissNotification);

// 删除通知
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
