/**
 * 通知/提醒数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');
const logger = require('../utils/logger');

class Notification {
  /**
   * 创建物料价格变更记录并生成通知
   * @param {Object} data - 价格变更数据
   * @returns {Promise<number>} 价格变更记录ID
   */
  static async recordPriceChange(data) {
    const { materialId, oldPrice, newPrice, changedBy } = data;
    
    // 计算价格变动百分比
    const priceChangeRate = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) : 0;
    
    return await dbManager.transaction(async (client) => {
      // 1. 创建价格变更记录
      const priceChangeResult = await client.query(
        `INSERT INTO material_price_changes (material_id, old_price, new_price, price_change_rate, changed_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [materialId, oldPrice, newPrice, priceChangeRate, changedBy]
      );
      const priceChangeId = priceChangeResult.rows[0].id;
      
      // 2. 获取物料信息
      const materialResult = await client.query(
        'SELECT item_no, name FROM materials WHERE id = $1',
        [materialId]
      );
      const material = materialResult.rows[0];
      
      if (!material) {
        throw new Error('物料不存在');
      }
      
      // 3. 查找受影响的型号
      const affectedModels = await client.query(
        `SELECT DISTINCT m.id, m.model_name 
         FROM models m 
         JOIN model_bom_materials b ON m.id = b.model_id 
         WHERE b.material_id = $1 AND b.is_active = true`,
        [materialId]
      );
      
      // 4. 为每个受影响的型号创建通知
      const notificationIds = [];
      for (const model of affectedModels.rows) {
        // 查找该型号关联的标准成本
        const standardCosts = await client.query(
          `SELECT DISTINCT sc.id, sc.sales_type
           FROM standard_costs sc
           JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
           WHERE pc.model_id = $1 AND sc.is_current = true`,
          [model.id]
        );
        
        // 查找该型号关联的报价单（非草稿状态）
        const quotations = await client.query(
          `SELECT DISTINCT id, quotation_no, created_by
           FROM quotations 
           WHERE model_id = $1 AND status != 'draft'`,
          [model.id]
        );
        
        // 创建型号级别通知 - 只通知管理员和生产角色
        const title = `物料价格变动提醒`;
        const content = `物料「${material.item_no} - ${material.name}」价格从 ${oldPrice} 变更为 ${newPrice}（${priceChangeRate >= 0 ? '+' : ''}${(priceChangeRate * 100).toFixed(2)}%），影响型号「${model.model_name}」`;
        
        // 为管理员创建通知
        const adminNotificationResult = await client.query(
          `INSERT INTO notifications (type, title, content, material_id, price_change_id, model_id, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          ['material_price_changed', title, content, materialId, priceChangeId, model.id, 'admin']
        );
        notificationIds.push(adminNotificationResult.rows[0].id);
        
        // 为生产角色创建通知
        const productionNotificationResult = await client.query(
          `INSERT INTO notifications (type, title, content, material_id, price_change_id, model_id, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          ['material_price_changed', title, content, materialId, priceChangeId, model.id, 'production']
        );
        notificationIds.push(productionNotificationResult.rows[0].id);
        
        // 为标准成本创建通知 - 只通知审核员（reviewer）
        for (const sc of standardCosts.rows) {
          const scTitle = `标准成本受影响提醒`;
          const scContent = `物料「${material.item_no} - ${material.name}」价格变动，标准成本（${sc.sales_type === 'domestic' ? '国内' : '出口'}）可能需要更新`;
          
          const scNotificationResult = await client.query(
            `INSERT INTO notifications (type, title, content, material_id, price_change_id, model_id, standard_cost_id, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            ['material_price_changed', scTitle, scContent, materialId, priceChangeId, model.id, sc.id, 'reviewer']
          );
          notificationIds.push(scNotificationResult.rows[0].id);
        }
        
        // 为报价单创建通知 - 只通知创建人自己
        for (const q of quotations.rows) {
          const qTitle = `成本记录受影响提醒`;
          const qContent = `物料「${material.item_no} - ${material.name}」价格变动，报价单「${q.quotation_no}」的成本可能需要重新核算`;
          
          const qNotificationResult = await client.query(
            `INSERT INTO notifications (type, title, content, material_id, price_change_id, model_id, quotation_id, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            ['material_price_changed', qTitle, qContent, materialId, priceChangeId, model.id, q.id, q.created_by]
          );
          notificationIds.push(qNotificationResult.rows[0].id);
        }
      }
      
      // 5. 标记价格变更记录为已处理
      await client.query(
        'UPDATE material_price_changes SET is_processed = true WHERE id = $1',
        [priceChangeId]
      );
      
      logger.info(`物料价格变更已记录并生成 ${notificationIds.length} 条通知`, { materialId, priceChangeId });
      
      return { priceChangeId, notificationIds, affectedModelCount: affectedModels.rows.length };
    });
  }
  
  /**
   * 获取用户的通知列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} { data: [], total: number, unreadCount: number }
   */
  static async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, onlyUnread = false, type = null } = options;
    const offset = (page - 1) * pageSize;
    
    // 验证参数
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid userId');
    }
    
    // 获取用户角色
    const userResult = await dbManager.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userRole = userResult.rows[0].role;
    
    // 构建 WHERE 子句（使用参数化查询防止 SQL 注入）
    let whereConditions = [];
    let params = [userId]; // $1 = userId
    let paramIndex = 2;    // 从 $2 开始
    
    // 管理员可以看到所有通知，其他用户根据权限过滤
    if (userRole === 'admin') {
      // 管理员：看到所有通知
      whereConditions.push('(1=1)'); // 永远为真，不过滤
    } else {
      // 非管理员：只能看到指定给自己的通知（user_id）或指定给角色的通知（role）
      whereConditions.push(`(n.user_id = $1 OR n.user_id IS NULL)`);
      
      // 角色过滤 - 通知的 role 为 null 表示对所有角色可见
      if (userRole) {
        whereConditions.push(`(n.role = $${paramIndex} OR n.role IS NULL)`);
        params.push(userRole);
        paramIndex++;
      } else {
        whereConditions.push('(n.role IS NULL)');
      }
    }
    
    // 未读过滤
    if (onlyUnread) {
      whereConditions.push('(un.is_read = false OR un.is_read IS NULL)');
      whereConditions.push('(n.is_dismissed = false OR n.is_dismissed IS NULL)');
    }
    
    // 类型过滤
    if (type) {
      // 验证 type 是否为允许的枚举值
      const validTypes = ['material_price_changed', 'system', 'review'];
      if (!validTypes.includes(type)) {
        throw new Error('Invalid notification type');
      }
      whereConditions.push(`n.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');
    
    // 查询总数
    const countResult = await dbManager.query(
      `SELECT COUNT(*) as total FROM notifications n
       LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    
    // 查询未读数 - 同样根据角色过滤
    let unreadWhereConditions = [];
    let unreadParams = [userId]; // $1 = userId
    let unreadParamIndex = 2;
    
    if (userRole === 'admin') {
      unreadWhereConditions.push('(1=1)');
    } else {
      unreadWhereConditions.push('(n.user_id = $1 OR n.user_id IS NULL)');
      if (userRole) {
        unreadWhereConditions.push(`(n.role = $${unreadParamIndex} OR n.role IS NULL)`);
        unreadParams.push(userRole);
        unreadParamIndex++;
      } else {
        unreadWhereConditions.push('(n.role IS NULL)');
      }
    }
    unreadWhereConditions.push('(un.is_read = false OR un.is_read IS NULL)');
    unreadWhereConditions.push('(n.is_dismissed = false OR n.is_dismissed IS NULL)');
    
    const unreadResult = await dbManager.query(
      `SELECT COUNT(*) as count FROM notifications n
       LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
       WHERE ${unreadWhereConditions.join(' AND ')}`,
      unreadParams
    );
    const unreadCount = parseInt(unreadResult.rows[0].count);
    
    // 查询数据
    const dataParams = [...params, pageSize, offset];
    const dataResult = await dbManager.query(
      `SELECT n.*, 
              m.item_no as material_item_no, m.name as material_name,
              model.model_name,
              sc.sales_type as standard_cost_sales_type,
              q.quotation_no,
              u.username as changed_by_username, u.real_name as changed_by_name,
              COALESCE(un.is_read, false) as is_read,
              COALESCE(un.is_dismissed, false) as is_dismissed,
              un.read_at
       FROM notifications n
       LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
       LEFT JOIN materials m ON n.material_id = m.id
       LEFT JOIN models model ON n.model_id = model.id
       LEFT JOIN standard_costs sc ON n.standard_cost_id = sc.id
       LEFT JOIN quotations q ON n.quotation_id = q.id
       LEFT JOIN material_price_changes pc ON n.price_change_id = pc.id
       LEFT JOIN users u ON pc.changed_by = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );
    
    return {
      data: dataResult.rows,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
  
  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  static async markAsRead(notificationId, userId) {
    const result = await dbManager.query(
      `INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, notification_id) 
       DO UPDATE SET is_read = true, read_at = NOW()
       RETURNING id`,
      [userId, notificationId]
    );
    return result.rowCount > 0;
  }
  
  /**
   * 批量标记通知为已读
   * @param {Array<number>} notificationIds - 通知ID数组
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 更新的记录数
   */
  static async markAsReadBatch(notificationIds, userId) {
    if (!notificationIds || notificationIds.length === 0) return 0;
    
    const placeholders = notificationIds.map((_, i) => `($1, $${i + 2}, true, NOW())`).join(',');
    const params = [userId, ...notificationIds];
    
    const result = await dbManager.query(
      `INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
       VALUES ${placeholders}
       ON CONFLICT (user_id, notification_id) 
       DO UPDATE SET is_read = true, read_at = NOW()`,
      params
    );
    return result.rowCount;
  }
  
  /**
   * 标记所有通知为已读
   * @param {number} userId - 用户ID
   * @returns {Promise<number>}
   */
  static async markAllAsRead(userId) {
    // 使用事务和单个查询避免竞态条件
    return await dbManager.transaction(async (client) => {
      // 获取用户角色
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const userRole = userResult.rows[0].role;
      
      // 构建权限过滤条件
      let permissionFilter = '';
      if (userRole !== 'admin') {
        permissionFilter = `AND (n.user_id = ${userId} OR n.user_id IS NULL)`;
        if (userRole) {
          permissionFilter += ` AND (n.role = '${userRole}' OR n.role IS NULL)`;
        } else {
          permissionFilter += ` AND (n.role IS NULL)`;
        }
      }
      
      // 使用 INSERT ... SELECT 在事务中直接完成操作，避免竞态条件
      const result = await client.query(
        `INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
         SELECT $1, n.id, true, NOW()
         FROM notifications n
         LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
         WHERE (un.is_read = false OR un.is_read IS NULL)
         AND (n.is_dismissed = false OR n.is_dismissed IS NULL)
         ${permissionFilter}
         ON CONFLICT (user_id, notification_id) 
         DO UPDATE SET is_read = true, read_at = NOW()
         RETURNING id`,
        [userId]
      );
      
      return result.rowCount;
    });
  }
  
  /**
   * 关闭/忽略通知
   * @param {number} notificationId - 通知ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  static async dismiss(notificationId, userId) {
    const result = await dbManager.query(
      `INSERT INTO user_notifications (user_id, notification_id, is_dismissed)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, notification_id) 
       DO UPDATE SET is_dismissed = true
       RETURNING id`,
      [userId, notificationId]
    );
    return result.rowCount > 0;
  }
  
  /**
   * 删除通知（软删除）
   * @param {number} notificationId - 通知ID
   * @returns {Promise<boolean>}
   */
  static async delete(notificationId) {
    const result = await dbManager.query(
      'UPDATE notifications SET is_dismissed = true WHERE id = $1',
      [notificationId]
    );
    return result.rowCount > 0;
  }
  
  /**
   * 获取物料价格变更历史
   * @param {number} materialId - 物料ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  static async getPriceChangeHistory(materialId, options = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    const result = await dbManager.query(
      `SELECT pc.*, 
              m.item_no, m.name as material_name,
              u.username as changed_by_username, u.real_name as changed_by_name
       FROM material_price_changes pc
       JOIN materials m ON pc.material_id = m.id
       JOIN users u ON pc.changed_by = u.id
       WHERE pc.material_id = $1
       ORDER BY pc.changed_at DESC
       LIMIT $2 OFFSET $3`,
      [materialId, pageSize, offset]
    );
    
    return result.rows;
  }
  
  /**
   * 获取受物料价格变更影响的实体列表
   * @param {number} priceChangeId - 价格变更记录ID
   * @returns {Promise<Object>} { models: [], standardCosts: [], quotations: [] }
   */
  static async getAffectedEntities(priceChangeId) {
    // 获取价格变更信息
    const priceChangeResult = await dbManager.query(
      'SELECT material_id FROM material_price_changes WHERE id = $1',
      [priceChangeId]
    );
    
    if (priceChangeResult.rows.length === 0) {
      return { models: [], standardCosts: [], quotations: [] };
    }
    
    const materialId = priceChangeResult.rows[0].material_id;
    
    // 获取受影响的型号
    const modelsResult = await dbManager.query(
      `SELECT DISTINCT m.id, m.model_name, r.name as regulation_name
       FROM models m
       JOIN model_bom_materials b ON m.id = b.model_id
       LEFT JOIN regulations r ON m.regulation_id = r.id
       WHERE b.material_id = $1 AND b.is_active = true`,
      [materialId]
    );
    
    // 获取受影响的标准成本
    const standardCostsResult = await dbManager.query(
      `SELECT DISTINCT sc.id, sc.sales_type, m.model_name, pc.config_name
       FROM standard_costs sc
       JOIN packaging_configs pc ON sc.packaging_config_id = pc.id
       JOIN models m ON pc.model_id = m.id
       JOIN model_bom_materials b ON m.id = b.model_id
       WHERE b.material_id = $1 AND sc.is_current = true AND b.is_active = true`,
      [materialId]
    );
    
    // 获取受影响的报价单
    const quotationsResult = await dbManager.query(
      `SELECT DISTINCT q.id, q.quotation_no, q.status, m.model_name
       FROM quotations q
       JOIN models m ON q.model_id = m.id
       JOIN model_bom_materials b ON m.id = b.model_id
       WHERE b.material_id = $1 AND q.status != 'draft' AND b.is_active = true`,
      [materialId]
    );
    
    return {
      models: modelsResult.rows,
      standardCosts: standardCostsResult.rows,
      quotations: quotationsResult.rows
    };
  }
  
  /**
   * 清理过期通知
   * @param {number} days - 保留天数（默认30天）
   * @returns {Promise<number>} 删除的记录数
   */
  static async cleanupExpired(days = 30) {
    // 验证 days 参数
    const validDays = parseInt(days);
    if (isNaN(validDays) || validDays < 1 || validDays > 365) {
      throw new Error('Invalid days parameter: must be between 1 and 365');
    }
    
    const result = await dbManager.query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${validDays} days'
       AND is_dismissed = true`
    );
    return result.rowCount;
  }
}

module.exports = Notification;
