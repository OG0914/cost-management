/** 执行迁移脚本 013_material_refactor.sql */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('开始执行迁移...');
        const sqlPath = path.join(__dirname, '013_material_refactor.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✓ 成功执行 013_material_refactor.sql');

    } catch (err) {
        console.error('迁移失败:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
