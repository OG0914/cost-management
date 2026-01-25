/**
 * 运行指定的 SQL 迁移文件
 * 用法: node scripts/run-migration.js 014_add_production_cycle.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbManager = require('../db/database');

async function runMigration() {
    const migrationFile = process.argv[2];

    if (!migrationFile) {
        console.error('请指定迁移文件名，例如: node scripts/run-migration.js 014_add_production_cycle.sql');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '../db/migrations', migrationFile);

    if (!fs.existsSync(filePath)) {
        console.error(`迁移文件不存在: ${filePath}`);
        process.exit(1);
    }

    try {
        console.log(`正在执行迁移: ${migrationFile}`);
        const sql = fs.readFileSync(filePath, 'utf8');

        await dbManager.query(sql);
        console.log(`✅ 迁移成功: ${migrationFile}`);

        process.exit(0);
    } catch (error) {
        console.error(`❌ 迁移失败: ${error.message}`);
        process.exit(1);
    }
}

runMigration();
