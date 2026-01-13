const dbManager = require('../db/database');

class Customer {
    static async findAll(options = {}) {
        const { page = 1, pageSize = 12, keyword, userId, includePublic = false } = options;
        const offset = (page - 1) * pageSize;
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (keyword) {
            params.push(`%${keyword}%`);
            conditions.push(`(c.vc_code ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR c.region ILIKE $${paramIndex})`);
            paramIndex++;
        }
        if (userId) {
            params.push(userId);
            if (includePublic) {
                conditions.push(`(c.user_id = $${paramIndex} OR c.user_id IS NULL)`);
            } else {
                conditions.push(`c.user_id = $${paramIndex}`);
            }
            paramIndex++;
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const countSql = `SELECT COUNT(*) FROM customers c ${whereClause}`;
        const countResult = await dbManager.query(countSql, params);
        const total = parseInt(countResult.rows[0].count);
        
        params.push(pageSize, offset);
        const dataSql = `SELECT c.id, c.vc_code, c.name, c.region, c.remark, c.user_id, u.real_name as salesperson_name, c.created_at, c.updated_at 
                         FROM customers c LEFT JOIN users u ON c.user_id = u.id
                         ${whereClause} 
                         ORDER BY c.created_at DESC 
                         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const dataResult = await dbManager.query(dataSql, params);
        
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
        const { vc_code, name, region, remark, user_id } = data;
        const result = await dbManager.query(
            `INSERT INTO customers (vc_code, name, region, remark, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [vc_code, name, region || null, remark || null, user_id || null]
        );
        return result.rows[0].id;
    }

    static async update(id, data) {
        const { vc_code, name, region, remark, user_id } = data;
        await dbManager.query(
            `UPDATE customers SET vc_code = $1, name = $2, region = $3, remark = $4, user_id = $5, updated_at = NOW() WHERE id = $6`,
            [vc_code, name, region || null, remark || null, user_id !== undefined ? user_id : null, id]
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

    static async search(keyword, currentUserId = null, isAdminOrReviewer = false) {
        let sql, params;
        if (isAdminOrReviewer) { // 管理员/审核员可搜索所有客户
            sql = `SELECT c.id, c.vc_code, c.name, c.region, c.user_id, u.real_name as salesperson_name
                   FROM customers c LEFT JOIN users u ON c.user_id = u.id
                   WHERE c.vc_code ILIKE $1 OR c.name ILIKE $1 
                   ORDER BY c.name LIMIT 50`;
            params = [`%${keyword}%`];
        } else { // 业务员只能搜索自己的客户+公共客户
            sql = `SELECT c.id, c.vc_code, c.name, c.region, c.user_id, u.real_name as salesperson_name
                   FROM customers c LEFT JOIN users u ON c.user_id = u.id
                   WHERE (c.vc_code ILIKE $1 OR c.name ILIKE $1) AND (c.user_id IS NULL OR c.user_id = $2)
                   ORDER BY c.name LIMIT 50`;
            params = [`%${keyword}%`, currentUserId];
        }
        const result = await dbManager.query(sql, params);
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
