/**
 * SQL 查询构建器
 * 用于安全地构建动态 SQL 查询，避免手动拼接字符串
 */

class QueryBuilder {
  /**
   * 构造函数
   * @param {string} tableName - 表名（可包含别名，如 'quotations q'）
   */
  constructor(tableName) {
    this.table = tableName;
    this.conditions = [];
    this.params = [];
    this.joins = [];
    this.orderBy = '';
    this.limitValue = null;
    this.offsetValue = null;
  }

  /**
   * 添加 WHERE 条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符（=, >, <, >=, <=, !=）
   * @param {*} value - 值
   * @returns {QueryBuilder} 返回自身以支持链式调用
   */
  where(field, operator, value) {
    this.conditions.push(`${field} ${operator} ?`);
    this.params.push(value);
    return this;
  }

  /**
   * 添加 WHERE IN 条件
   * @param {string} field - 字段名
   * @param {Array} values - 值数组
   * @returns {QueryBuilder}
   */
  whereIn(field, values) {
    if (!values || values.length === 0) {
      return this;
    }
    const placeholders = values.map(() => '?').join(', ');
    this.conditions.push(`${field} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  /**
   * 添加 LIKE 条件
   * @param {string} field - 字段名
   * @param {string} value - 值（会自动添加 %）
   * @returns {QueryBuilder}
   */
  whereLike(field, value) {
    this.conditions.push(`${field} LIKE ?`);
    this.params.push(`%${value}%`);
    return this;
  }

  /**
   * 添加日期条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符（=, >, <, >=, <=）
   * @param {string} date - 日期值
   * @returns {QueryBuilder}
   */
  whereDate(field, operator, date) {
    this.conditions.push(`DATE(${field}) ${operator} ?`);
    this.params.push(date);
    return this;
  }

  /**
   * 添加 LEFT JOIN
   * @param {string} table - 表名
   * @param {string} condition - 连接条件
   * @returns {QueryBuilder}
   */
  leftJoin(table, condition) {
    this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  /**
   * 添加 ORDER BY DESC
   * @param {string} field - 字段名
   * @returns {QueryBuilder}
   */
  orderByDesc(field) {
    this.orderBy = `ORDER BY ${field} DESC`;
    return this;
  }

  /**
   * 添加 ORDER BY ASC
   * @param {string} field - 字段名
   * @returns {QueryBuilder}
   */
  orderByAsc(field) {
    this.orderBy = `ORDER BY ${field} ASC`;
    return this;
  }

  /**
   * 添加 LIMIT
   * @param {number} value - 限制数量
   * @returns {QueryBuilder}
   */
  limit(value) {
    this.limitValue = value;
    return this;
  }

  /**
   * 添加 OFFSET
   * @param {number} value - 偏移量
   * @returns {QueryBuilder}
   */
  offset(value) {
    this.offsetValue = value;
    return this;
  }

  /**
   * 构建 SELECT 查询
   * @param {string} fields - 查询字段（默认 *）
   * @returns {Object} { sql: string, params: Array }
   */
  buildSelect(fields = '*') {
    let sql = `SELECT ${fields} FROM ${this.table}`;
    
    // 添加 JOIN
    if (this.joins.length > 0) {
      sql += ' ' + this.joins.join(' ');
    }
    
    // 添加 WHERE
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.conditions.join(' AND ');
    }
    
    // 添加 ORDER BY
    if (this.orderBy) {
      sql += ' ' + this.orderBy;
    }
    
    // 使用局部变量组合参数，不修改 this.params
    const queryParams = [...this.params];
    
    // 添加 LIMIT
    if (this.limitValue !== null) {
      sql += ' LIMIT ?';
      queryParams.push(this.limitValue);
    }
    
    // 添加 OFFSET
    if (this.offsetValue !== null) {
      sql += ' OFFSET ?';
      queryParams.push(this.offsetValue);
    }
    
    return { sql, params: queryParams };
  }

  /**
   * 构建 COUNT 查询
   * @returns {Object} { sql: string, params: Array }
   */
  buildCount() {
    let sql = `SELECT COUNT(*) as total FROM ${this.table}`;
    
    // 添加 JOIN
    if (this.joins.length > 0) {
      sql += ' ' + this.joins.join(' ');
    }
    
    // 添加 WHERE
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.conditions.join(' AND ');
    }
    
    return { sql, params: [...this.params] };
  }

  /**
   * 克隆当前查询构建器（用于复用条件）
   * @returns {QueryBuilder}
   */
  clone() {
    const cloned = new QueryBuilder(this.table);
    cloned.conditions = [...this.conditions];
    cloned.params = [...this.params];
    cloned.joins = [...this.joins];
    cloned.orderBy = this.orderBy;
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    return cloned;
  }
}

module.exports = QueryBuilder;
