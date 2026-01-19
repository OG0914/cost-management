/**
 * 报价单明细数据模型
 * PostgreSQL 异步版本
 */

const dbManager = require('../db/database');

class QuotationItem {
  /**
   * 创建报价单明细
   * @param {Object} data - 明细数据
   * @returns {Promise<number>} 新明细的 ID
   */
  static async create(data) {
    const result = await dbManager.query(
      `INSERT INTO quotation_items (
        quotation_id, category, item_name, usage_amount, 
        unit_price, subtotal, is_changed, original_value, material_id, after_overhead
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        data.quotation_id,
        data.category,
        data.item_name,
        data.usage_amount,
        data.unit_price,
        data.subtotal,
        data.is_changed || false,
        data.original_value || null,
        data.material_id || null,
        data.after_overhead || false
      ]
    );
    
    return result.rows[0].id;
  }

  /**
   * 批量创建报价单明细（优化版：批量INSERT）
   * @param {Array} items - 明细数组
   * @returns {Promise<number>} 创建的明细数量
   */
  static async batchCreate(items) {
    if (!items || items.length === 0) return 0;
    
    // 构建批量INSERT语句
    const values = [];
    const placeholders = [];
    let paramIndex = 0;
    
    items.forEach((item) => {
      const start = paramIndex + 1;
      placeholders.push(`($${start}, $${start+1}, $${start+2}, $${start+3}, $${start+4}, $${start+5}, $${start+6}, $${start+7}, $${start+8}, $${start+9})`);
      values.push(
        item.quotation_id,
        item.category,
        item.item_name,
        item.usage_amount,
        item.unit_price,
        item.subtotal,
        item.is_changed || false,
        item.original_value || null,
        item.material_id || null,
        item.after_overhead || false
      );
      paramIndex += 10;
    });

    const sql = `INSERT INTO quotation_items (
      quotation_id, category, item_name, usage_amount, 
      unit_price, subtotal, is_changed, original_value, material_id, after_overhead
    ) VALUES ${placeholders.join(', ')}`;
    
    await dbManager.query(sql, values);
    return items.length;
  }


  /**
   * 根据 ID 查找明细
   * @param {number} id - 明细 ID
   * @returns {Promise<Object|null>} 明细对象或 null
   */
  static async findById(id) {
    const result = await dbManager.query(
      'SELECT * FROM quotation_items WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据报价单 ID 查找所有明细
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<Array>} 明细列表
   */
  static async findByQuotationId(quotationId) {
    const result = await dbManager.query(
      `SELECT * FROM quotation_items 
       WHERE quotation_id = $1 
       ORDER BY category, id`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * 根据报价单 ID 和分类查找明细
   * @param {number} quotationId - 报价单 ID
   * @param {string} category - 分类（material/process/packaging）
   * @returns {Promise<Array>} 明细列表
   */
  static async findByQuotationIdAndCategory(quotationId, category) {
    // 如果是包材分类，需要关联获取外箱材积
    if (category === 'packaging') {
      const quotationResult = await dbManager.query(
        'SELECT packaging_config_id FROM quotations WHERE id = $1',
        [quotationId]
      );
      const quotation = quotationResult.rows[0];
      
      if (quotation && quotation.packaging_config_id) {
        // 先获取包材明细
        const itemsResult = await dbManager.query(
          `SELECT * FROM quotation_items WHERE quotation_id = $1 AND category = $2 ORDER BY id`,
          [quotationId, category]
        );
        const items = itemsResult.rows;
        
        // 获取该配置下所有包材及其外箱材积
        const pmResult = await dbManager.query(
          `SELECT material_name, carton_volume FROM packaging_materials WHERE packaging_config_id = $1`,
          [quotation.packaging_config_id]
        );
        
        // 找出有外箱材积的记录
        const cartonVolumeRecord = pmResult.rows.find(pm => pm.carton_volume && parseFloat(pm.carton_volume) > 0);
        const fallbackCartonVolume = cartonVolumeRecord ? parseFloat(cartonVolumeRecord.carton_volume) : null;
        
        // 构建名称映射（精确匹配）
        const pmMap = new Map(pmResult.rows.map(pm => [pm.material_name, parseFloat(pm.carton_volume) || null]));
        
        // 为每个包材项匹配外箱材积
        return items.map(item => {
          // 1. 先尝试精确匹配
          let cartonVolume = pmMap.get(item.item_name);
          
          // 2. 如果精确匹配不到，尝试模糊匹配
          if (!cartonVolume) {
            for (const [name, vol] of pmMap) {
              if (vol && (name.includes(item.item_name) || item.item_name.includes(name))) {
                cartonVolume = vol;
                break;
              }
            }
          }
          
          // 3. 如果还是匹配不到但有兜底值，检查是否是外箱类包材
          if (!cartonVolume && fallbackCartonVolume) {
            const isCartonItem = item.item_name.includes('外箱') || item.item_name.includes('纸箱') || item.item_name.includes('彩箱') || item.item_name.includes('卡通箱');
            if (isCartonItem) cartonVolume = fallbackCartonVolume;
          }
          
          return { ...item, carton_volume: cartonVolume };
        });
      }
    }
    
    // 其他分类或没有 packaging_config_id 时使用普通查询
    const result = await dbManager.query(
      `SELECT * FROM quotation_items 
       WHERE quotation_id = $1 AND category = $2
       ORDER BY id`,
      [quotationId, category]
    );
    return result.rows;
  }

  /**
   * 获取报价单明细的分组统计（优化版：单次查询避免N+1）
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<Object>} 分组统计数据
   */
  static async getGroupedByCategory(quotationId) {
    // 获取报价单的 packaging_config_id
    const quotationResult = await dbManager.query(
      'SELECT packaging_config_id FROM quotations WHERE id = $1',
      [quotationId]
    );
    const quotation = quotationResult.rows[0];
    const packagingConfigId = quotation?.packaging_config_id;

    // 单次查询获取所有明细，包含包材的外箱材积
    const result = await dbManager.query(
      `SELECT 
        qi.*,
        CASE WHEN qi.category = 'packaging' AND $2::int IS NOT NULL 
          THEN pm.carton_volume ELSE NULL END as carton_volume
      FROM quotation_items qi
      LEFT JOIN packaging_materials pm 
        ON qi.category = 'packaging' 
        AND pm.packaging_config_id = $2 
        AND pm.material_name = qi.item_name
      WHERE qi.quotation_id = $1
      ORDER BY qi.category, qi.id`,
      [quotationId, packagingConfigId]
    );
    
    // 初始化分组结构
    const grouped = {
      material: { items: [], total: 0, count: 0 },
      process: { items: [], total: 0, count: 0 },
      packaging: { items: [], total: 0, count: 0 }
    };

    // 单次遍历完成分组和统计
    result.rows.forEach(row => {
      const category = row.category;
      if (grouped[category]) {
        grouped[category].items.push(row);
        grouped[category].total += parseFloat(row.subtotal) || 0;
        grouped[category].count++;
      }
    });

    return grouped;
  }


  /**
   * 更新明细
   * @param {number} id - 明细 ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    const allowedFields = [
      'item_name', 'usage_amount', 'unit_price', 
      'subtotal', 'is_changed', 'original_value', 'material_id', 'after_overhead'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        paramIndex++;
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    paramIndex++;
    values.push(id);

    const result = await dbManager.query(
      `UPDATE quotation_items 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    );

    return result.rowCount > 0;
  }

  /**
   * 删除明细
   * @param {number} id - 明细 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await dbManager.query(
      'DELETE FROM quotation_items WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * 删除报价单的所有明细
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteByQuotationId(quotationId) {
    const result = await dbManager.query(
      'DELETE FROM quotation_items WHERE quotation_id = $1',
      [quotationId]
    );
    return result.rowCount > 0;
  }

  /**
   * 获取修改项列表
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<Array>} 修改项列表
   */
  static async getChangedItems(quotationId) {
    const result = await dbManager.query(
      `SELECT * FROM quotation_items 
       WHERE quotation_id = $1 AND is_changed = true
       ORDER BY category, id`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * 计算报价单明细总计
   * @param {number} quotationId - 报价单 ID
   * @returns {Promise<Object>} 总计数据
   */
  static async calculateTotals(quotationId) {
    const result = await dbManager.query(
      `SELECT 
        SUM(CASE WHEN category = 'material' THEN subtotal ELSE 0 END) as material_total,
        SUM(CASE WHEN category = 'process' THEN subtotal ELSE 0 END) as process_total,
        SUM(CASE WHEN category = 'packaging' THEN subtotal ELSE 0 END) as packaging_total,
        SUM(subtotal) as grand_total
      FROM quotation_items
      WHERE quotation_id = $1`,
      [quotationId]
    );
    return result.rows[0];
  }

  /**
   * 标记明细为已修改
   * @param {number} id - 明细 ID
   * @param {number} originalValue - 原始值
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async markAsChanged(id, originalValue) {
    const result = await dbManager.query(
      `UPDATE quotation_items 
       SET is_changed = true, original_value = $1
       WHERE id = $2`,
      [originalValue, id]
    );
    return result.rowCount > 0;
  }

  /**
   * 取消修改标记
   * @param {number} id - 明细 ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async unmarkAsChanged(id) {
    const result = await dbManager.query(
      `UPDATE quotation_items 
       SET is_changed = false, original_value = NULL
       WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * 检查原料是否被报价单明细引用
   * @param {number} materialId - 原料 ID
   * @returns {Promise<boolean>} 是否被引用
   */
  static async isMaterialUsed(materialId) {
    const result = await dbManager.query(
      'SELECT COUNT(*) as count FROM quotation_items WHERE material_id = $1',
      [materialId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 获取引用某原料的报价单列表
   * @param {number} materialId - 原料 ID
   * @returns {Promise<Array>} 报价单列表
   */
  static async getQuotationsByMaterial(materialId) {
    const result = await dbManager.query(`
      SELECT DISTINCT q.id, q.quotation_no, q.customer_name, q.status
      FROM quotation_items qi
      JOIN quotations q ON qi.quotation_id = q.id
      WHERE qi.material_id = $1
      ORDER BY q.created_at DESC
      LIMIT 10
    `, [materialId]);
    return result.rows;
  }
}

module.exports = QuotationItem;
