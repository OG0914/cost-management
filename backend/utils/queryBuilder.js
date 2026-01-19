/**
 * SQL 查询构建器 - 支持 PostgreSQL 的 $n 占位符格式
 */

class QueryBuilder {
  constructor(tableName) {
    this.table = tableName;
    this.conditions = [];
    this.params = [];
    this.joins = [];
    this.orderBy = '';
    this.limitValue = null;
    this.offsetValue = null;
    this.paramIndex = 0;
  }

  _nextPlaceholder() {
    this.paramIndex++;
    return `$${this.paramIndex}`; // 修复：添加 $ 符号
  }

  where(field, operator, value) {
    this.conditions.push(`${field} ${operator} ${this._nextPlaceholder()}`);
    this.params.push(value);
    return this;
  }

  whereIn(field, values) {
    if (!values || values.length === 0) return this;
    const placeholders = values.map(() => this._nextPlaceholder()).join(', ');
    this.conditions.push(`${field} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  whereLike(field, value) {
    this.conditions.push(`${field} LIKE ${this._nextPlaceholder()}`);
    this.params.push(`%${value}%`);
    return this;
  }

  whereLikeOr(fields, value) { // 多字段 OR 模糊匹配
    if (!value || !value.trim() || !fields || fields.length === 0) return this;
    const trimmedValue = value.trim();
    const conditions = fields.map(field => `${field} ILIKE ${this._nextPlaceholder()}`);
    this.conditions.push(`(${conditions.join(' OR ')})`);
    fields.forEach(() => this.params.push(`%${trimmedValue}%`));
    return this;
  }

  whereDate(field, operator, date) {
    this.conditions.push(`${field}::date ${operator} ${this._nextPlaceholder()}`);
    this.params.push(date);
    return this;
  }

  whereRaw(condition, params = []) { // 原始SQL条件，支持带占位符的复杂条件
    let rawCondition = condition;
    params.forEach(() => { rawCondition = rawCondition.replace(/\$\d+/, this._nextPlaceholder()); });
    this.conditions.push(rawCondition);
    this.params.push(...params);
    return this;
  }

  leftJoin(table, condition) {
    this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  orderByDesc(field) {
    this.orderBy = `ORDER BY ${field} DESC`;
    return this;
  }

  orderByAsc(field) {
    this.orderBy = `ORDER BY ${field} ASC`;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  offset(value) {
    this.offsetValue = value;
    return this;
  }

  buildSelect(fields = '*') {
    this.paramIndex = 0; // 重置索引
    const rebuiltConditions = this.conditions.map(condition =>
      condition.replace(/\$\d+/g, () => { this.paramIndex++; return `$${this.paramIndex}`; })
    );

    let sql = `SELECT ${fields} FROM ${this.table}`;
    if (this.joins.length > 0) sql += ' ' + this.joins.join(' ');
    if (rebuiltConditions.length > 0) sql += ' WHERE ' + rebuiltConditions.join(' AND ');
    if (this.orderBy) sql += ' ' + this.orderBy;

    const queryParams = [...this.params];
    if (this.limitValue !== null) { this.paramIndex++; sql += ` LIMIT $${this.paramIndex}`; queryParams.push(this.limitValue); }
    if (this.offsetValue !== null) { this.paramIndex++; sql += ` OFFSET $${this.paramIndex}`; queryParams.push(this.offsetValue); }

    return { sql, params: queryParams };
  }

  buildCount() {
    this.paramIndex = 0;
    const rebuiltConditions = this.conditions.map(condition =>
      condition.replace(/\$\d+/g, () => { this.paramIndex++; return `$${this.paramIndex}`; })
    );

    let sql = `SELECT COUNT(*) as total FROM ${this.table}`;
    if (this.joins.length > 0) sql += ' ' + this.joins.join(' ');
    if (rebuiltConditions.length > 0) sql += ' WHERE ' + rebuiltConditions.join(' AND ');

    return { sql, params: [...this.params] };
  }

  clone() {
    const cloned = new QueryBuilder(this.table);
    cloned.conditions = [...this.conditions];
    cloned.params = [...this.params];
    cloned.joins = [...this.joins];
    cloned.orderBy = this.orderBy;
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    cloned.paramIndex = this.paramIndex;
    return cloned;
  }
}

module.exports = QueryBuilder;
