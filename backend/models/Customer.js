const dbManager = require('../db/database');

class Customer {
    static async findAll(options = {}) {
        const { page = 1, pageSize = 12, keyword } = options;
        const offset = (page - 1) * pageSize;
        let whereClause = '';
        const params = [];
        
        if (keyword) {
            params.push(`%${keyword}%`);
            whereClause = `WHERE vc_code ILIKE $1 OR name ILIKE $1 OR region ILIKE $1`;
        }
        
        const countSql = `SELECT COUNT(*) FROM customers ${whereClause}`;
        const countResult = await dbManager.query(countSql, params);
        const total = parseInt(countResult.rows[0].count);
        
        const limitParam = keyword ? '$2' : '$1';
        const offsetParam = keyword ? '$3' : '$2';
        const dataSql = `SELECT id, vc_code, name, region, remark, created_at, updated_at 
                         FROM customers ${whereClause} 
                         ORDER BY created_at DESC 
                         LIMIT ${limitParam} OFFSET ${offsetParam}`;
        const dataResult = await dbManager.query(dataSql, [...params, pageSize, offset]);
        
        return { data: dataResult.rows, total, page, pageSize };
    }

    static async findById(id) {
        const result = await dbManager.query('SELECT * FROM customers WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async findByVcCode(vcCode) {
        const result = await dbManager.query('SELECT * FROM customers WHERE vc_code = $1', [vcCode]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const { vc_code, name, region, remark } = data;
        const result = await dbManager.query(
            `INSERT INTO customers (vc_code, name, region, remark) VALUES ($1, $2, $3, $4) RETURNING id`,
            [vc_code, name, region || null, remark || null]
        );
        return result.rows[0].id;
    }

    static async update(id, data) {
        const { vc_code, name, region, remark } = data;
        await dbManager.query(
            `UPDATE customers SET vc_code = $1, name = $2, region = $3, remark = $4, updated_at = NOW() WHERE id = $5`,
            [vc_code, name, region || null, remark || null, id]
        );
        return true;
    }

    static async delete(id) {
        await dbManager.query('DELETE FROM customers WHERE id = $1', [id]);
        return true;
    }

    static async batchDelete(ids) {
        if (!ids || ids.length === 0) return 0;
        const result = await dbManager.query('DELETE FROM customers WHERE id = ANY($1)', [ids]);
        return result.rowCount;
    }

    static async search(keyword) {
        const result = await dbManager.query(
            `SELECT id, vc_code, name, region FROM customers 
             WHERE vc_code ILIKE $1 OR name ILIKE $1 
             ORDER BY name LIMIT 50`,
            [`%${keyword}%`]
        );
        return result.rows;
    }

    static async upsert(data) {
        const { vc_code, name, region, remark } = data;
        const existing = await this.findByVcCode(vc_code);
        if (existing) {
            await this.update(existing.id, { vc_code, name, region, remark });
            return { id: existing.id, action: 'updated' };
        }
        const id = await this.create({ vc_code, name, region, remark });
        return { id, action: 'created' };
    }
}

module.exports = Customer;
