class QueryBuilder {
    constructor(tableName) {
        this.table = tableName;
        this.conditions = [];
        this.params = [];
        this.joins = [];
        this.orderBy = '';
        this.limitValue = null;
        this.offsetValue = null;
    }

    where(field, operator, value) {
        this.conditions.push(`${field} ${operator} ?`);
        this.params.push(value);
        return this;
    }

    whereIn(field, values) {
        const placeholders = values.map(() => '?').join(', ');
        this.conditions.push(`${field} IN (${placeholders})`);
        this.params.push(...values);
        return this;
    }

    whereLike(field, value) {
        this.conditions.push(`${field} LIKE ?`);
        this.params.push(`%${value}%`);
        return this;
    }

    whereDate(field, operator, date) {
        this.conditions.push(`DATE(${field}) ${operator} ?`);
        this.params.push(date);
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

    limit(value) {
        this.limitValue = value;
        return this;
    }

    offset(value) {
        this.offsetValue = value;
        return this;
    }

    buildSelect(fields = '*') {
        let sql = `SELECT ${fields} FROM ${this.table}`;
        
        if (this.joins.length > 0) {
            sql += ' ' + this.joins.join(' ');
        }
        
        if (this.conditions.length > 0) {
            sql += ' WHERE ' + this.conditions.join(' AND ');
        }
        
        if (this.orderBy) {
            sql += ' ' + this.orderBy;
        }
        
        if (this.limitValue !== null) {
            sql += ' LIMIT ?';
            this.params.push(this.limitValue);
        }
        
        if (this.offsetValue !== null) {
            sql += ' OFFSET ?';
            this.params.push(this.offsetValue);
        }
        
        return { sql, params: this.params };
    }

    buildCount() {
        let sql = `SELECT COUNT(*) as total FROM ${this.table}`;
        
        if (this.joins.length > 0) {
            sql += ' ' + this.joins.join(' ');
        }
        
        if (this.conditions.length > 0) {
            sql += ' WHERE ' + this.conditions.join(' AND ');
        }
        
        return { sql, params: this.params };
    }
}

module.exports = QueryBuilder;
