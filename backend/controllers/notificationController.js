/**
 * 通知控制器
 */

const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// 常量定义
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_BATCH_SIZE = 100;
const VALID_NOTIFICATION_TYPES = ['material_price_changed', 'system', 'review'];

/**
 * 验证ID是否为有效的正整数
 * @param {*} id 
 * @returns {boolean}
 */
const isValidId = (id) => {
  const num = parseInt(id);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * 获取当前用户的通知列表
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { page = 1, pageSize = DEFAULT_PAGE_SIZE, onlyUnread = false, type } = req.query;
    
    // 验证并限制 page 和 pageSize
    page = Math.max(1, parseInt(page) || 1);
    pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize) || DEFAULT_PAGE_SIZE));
    
    // 验证 onlyUnread
    onlyUnread = onlyUnread === 'true';
    
    // 验证 type 枚举值
    if (type && !VALID_NOTIFICATION_TYPES.includes(type)) {
      return res.status(400).json(error('Invalid type parameter', 400));
    }
    
    const result = await Notification.findByUser(userId, {
      page,
      pageSize,
      onlyUnread,
      type
    });
    
    res.json(success(result));
  } catch (err) {
    logger.error('获取通知列表失败:', err);
    next(err);
  }
};

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await Notification.findByUser(userId, { page: 1, pageSize: 1, onlyUnread: true });
    
    res.json(success({ unreadCount: result.unreadCount }));
  } catch (err) {
    logger.error('获取未读通知数量失败:', err);
    next(err);
  }
};

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 验证ID
    if (!isValidId(id)) {
      return res.status(400).json(error('Invalid notification ID', 400));
    }
    
    const result = await Notification.markAsRead(parseInt(id), userId);
    
    if (result) {
      res.json(success(null, '标记已读成功'));
    } else {
      res.status(400).json(error('标记已读失败', 400));
    }
  } catch (err) {
    logger.error('标记通知已读失败:', err);
    next(err);
  }
};

/**
 * 批量标记通知为已读
 * PUT /api/notifications/read-batch
 */
const markAsReadBatch = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(error('请提供通知ID列表', 400));
    }
    
    // 限制批量操作数量
    if (ids.length > MAX_BATCH_SIZE) {
      return res.status(400).json(error(`一次最多标记${MAX_BATCH_SIZE}条通知`, 400));
    }
    
    // 验证所有ID为有效数字
    const validIds = ids
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.status(400).json(error('无效的通知ID列表', 400));
    }
    
    const count = await Notification.markAsReadBatch(validIds, userId);
    
    res.json(success({ markedCount: count }, '批量标记已读成功'));
  } catch (err) {
    logger.error('批量标记通知已读失败:', err);
    next(err);
  }
};

/**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.markAllAsRead(userId);
    
    res.json(success({ markedCount: count }, '全部标记已读成功'));
  } catch (err) {
    logger.error('标记所有通知已读失败:', err);
    next(err);
  }
};

/**
 * 关闭/忽略通知
 * PUT /api/notifications/:id/dismiss
 */
const dismissNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 验证ID
    if (!isValidId(id)) {
      return res.status(400).json(error('Invalid notification ID', 400));
    }
    
    const result = await Notification.dismiss(parseInt(id), userId);
    
    if (result) {
      res.json(success(null, '通知已关闭'));
    } else {
      res.status(400).json(error('关闭通知失败', 400));
    }
  } catch (err) {
    logger.error('关闭通知失败:', err);
    next(err);
  }
};

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 验证ID
    if (!isValidId(id)) {
      return res.status(400).json(error('Invalid notification ID', 400));
    }
    
    // 权限检查：只有管理员可以删除通知
    if (userRole !== 'admin') {
      return res.status(403).json(error('无权删除此通知', 403));
    }
    
    const result = await Notification.delete(parseInt(id));
    
    if (result) {
      res.json(success(null, '删除成功'));
    } else {
      res.status(400).json(error('删除失败', 400));
    }
  } catch (err) {
    logger.error('删除通知失败:', err);
    next(err);
  }
};

/**
 * 获取物料价格变更历史
 * GET /api/notifications/price-history/:materialId
 */
const getPriceChangeHistory = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    let { page = 1, pageSize = DEFAULT_PAGE_SIZE } = req.query;
    
    // 验证ID
    if (!isValidId(materialId)) {
      return res.status(400).json(error('Invalid material ID', 400));
    }
    
    // 验证并限制 page 和 pageSize
    page = Math.max(1, parseInt(page) || 1);
    pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize) || DEFAULT_PAGE_SIZE));
    
    const result = await Notification.getPriceChangeHistory(parseInt(materialId), {
      page,
      pageSize
    });
    
    res.json(success(result));
  } catch (err) {
    logger.error('获取价格变更历史失败:', err);
    next(err);
  }
};

/**
 * 获取受价格变更影响的实体
 * GET /api/notifications/affected-entities/:priceChangeId
 */
const getAffectedEntities = async (req, res, next) => {
  try {
    const { priceChangeId } = req.params;
    
    // 验证ID
    if (!isValidId(priceChangeId)) {
      return res.status(400).json(error('Invalid price change ID', 400));
    }
    
    const result = await Notification.getAffectedEntities(parseInt(priceChangeId));
    
    res.json(success(result));
  } catch (err) {
    logger.error('获取受影响实体失败:', err);
    next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsReadBatch,
  markAllAsRead,
  dismissNotification,
  deleteNotification,
  getPriceChangeHistory,
  getAffectedEntities
};
