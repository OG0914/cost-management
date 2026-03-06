/**
 * 通知相关 API
 */
import request from '../utils/request'

/**
 * 获取通知列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getNotifications(params = {}) {
  return request.get('/notifications', { params })
}

/**
 * 获取未读通知数量
 * @returns {Promise}
 */
export function getUnreadCount() {
  return request.get('/notifications/unread-count')
}

/**
 * 标记通知为已读
 * @param {number} id - 通知ID
 * @returns {Promise}
 */
export function markAsRead(id) {
  return request.put(`/notifications/${id}/read`)
}

/**
 * 批量标记通知为已读
 * @param {Array<number>} ids - 通知ID列表
 * @returns {Promise}
 */
export function markAsReadBatch(ids) {
  return request.put('/notifications/read-batch', { ids })
}

/**
 * 标记所有通知为已读
 * @returns {Promise}
 */
export function markAllAsRead() {
  return request.put('/notifications/read-all')
}

/**
 * 关闭/忽略通知
 * @param {number} id - 通知ID
 * @returns {Promise}
 */
export function dismissNotification(id) {
  return request.put(`/notifications/${id}/dismiss`)
}

/**
 * 删除通知
 * @param {number} id - 通知ID
 * @returns {Promise}
 */
export function deleteNotification(id) {
  return request.delete(`/notifications/${id}`)
}

/**
 * 获取物料价格变更历史
 * @param {number} materialId - 物料ID
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getPriceChangeHistory(materialId, params = {}) {
  return request.get(`/notifications/price-history/${materialId}`, { params })
}

/**
 * 获取受价格变更影响的实体
 * @param {number} priceChangeId - 价格变更记录ID
 * @returns {Promise}
 */
export function getAffectedEntities(priceChangeId) {
  return request.get(`/notifications/affected-entities/${priceChangeId}`)
}
