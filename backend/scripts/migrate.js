/**
 * 统一数据库迁移脚本
 * 自动检测并应用所有必要的数据库结构更新
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/cost_analysis.db');

// 定义所有迁移
const migrations = [
  {
    name: '添加 users.is_active 字段',
    table: 'users',
    check: (columns) => !columns.includes('is_active'),
    sql: 'ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1'
  },
  {
    name: '添加 quotations.shipping_method 字段',
    table: 'quotations',
    check: (columns) => !columns.includes('shipping_method'),
    sql: 'ALTER TABLE quotations ADD COLUMN shipping_method TEXT'
  },
  {
    name: '添加 quotations.port 字段',
    table: 'quotations',
    check: (columns) => !columns.includes('port'),
    sql: 'ALTER TABLE quotations ADD COLUMN port TEXT'
  },
  {
    name: '添加 quotations.packaging_config_id 字段',
    table: 'quotations',
    check: (columns) => !columns.includes('packaging_config_id'),
    sql: 'ALTER TABLE quotations ADD COLUMN packaging_config_id INTEGER REFERENCES packaging_configs(id)'
  },
  {
    name: '添加 quotations.include_freight_in_base 字段',
    table: 'quotations',
    check: (columns) => !columns.includes('include_freight_in_base'),
    sql: 'ALTER TABLE quotations ADD COLUMN include_freight_in_base BOOLEAN DEFAULT 1'
  },
  {
    name: '添加 quotation_items.material_id 字段',
    table: 'quotation_items',
    check: (columns) => !columns.includes('material_id'),
    sql: 'ALTER TABLE quotation_items ADD COLUMN material_id INTEGER REFERENCES materials(id)'
  },
  {
    name: '将 models.remark 重命名为 model_category',
    table: 'models',
    check: (columns) => columns.includes('remark') && !columns.includes('model_category'),
    sql: `
      PRAGMA foreign_keys=OFF;
      
      BEGIN TRANSACTION;
      
      -- 创建新表
      CREATE TABLE models_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regulation_id INTEGER NOT NULL,
        model_name TEXT NOT NULL,
        model_category TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id)
      );
      
      -- 复制数据
      INSERT INTO models_new (id, regulation_id, model_name, model_category, is_active, created_at, updated_at)
      SELECT id, regulation_id, model_name, remark, is_active, created_at, updated_at
      FROM models;
      
      -- 删除旧表
      DROP TABLE models;
      
      -- 重命名新表
      ALTER TABLE models_new RENAME TO models;
      
      -- 重建索引
      CREATE INDEX idx_models_regulation_id ON models(regulation_id);
      
      COMMIT;
      
      PRAGMA foreign_keys=ON;
    `
  },
  {
    name: '添加 quotations.custom_profit_tiers 字段',
    table: 'quotations',
    check: (columns) => !columns.includes('custom_profit_tiers'),
    sql: 'ALTER TABLE quotations ADD COLUMN custom_profit_tiers TEXT'
  },
  {
    name: '添加原料系数配置',
    table: 'system_config',
    check: (columns, db) => {
      const exists = db.prepare("SELECT 1 FROM system_config WHERE config_key = 'material_coefficients'").get();
      return !exists;
    },
    sql: `INSERT INTO system_config (config_key, config_value, description) VALUES ('material_coefficients', '{"口罩": 0.97, "半面罩": 0.99}', '原料系数配置，按型号分类映射')`
  },
  {
    name: '创建标准成本表',
    table: 'standard_costs',
    check: (columns, db) => {
      const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='standard_costs'").get();
      return !exists;
    },
    sql: `
      CREATE TABLE standard_costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packaging_config_id INTEGER NOT NULL,
        quotation_id INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        is_current BOOLEAN DEFAULT 1,
        base_cost REAL NOT NULL,
        overhead_price REAL NOT NULL,
        domestic_price REAL,
        export_price REAL,
        quantity INTEGER NOT NULL,
        currency TEXT DEFAULT 'CNY',
        sales_type TEXT NOT NULL,
        set_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id),
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (set_by) REFERENCES users(id),
        UNIQUE(packaging_config_id, version)
      );
      CREATE INDEX idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
      CREATE INDEX idx_standard_costs_is_current ON standard_costs(is_current);
    `
  }
];

try {
  console.log('========================================');
  console.log('开始数据库迁移');
  console.log('数据库路径:', dbPath);
  console.log('========================================\n');
  
  const db = new Database(dbPath);
  let appliedCount = 0;
  let skippedCount = 0;
  
  // 按表分组获取列信息
  const tableColumns = {};
  
  for (const migration of migrations) {
    // 获取表结构（如果还没获取过）
    if (!tableColumns[migration.table]) {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name=?
      `).get(migration.table);
      
      if (!tableExists) {
        // 表不存在时，设置空数组，让 check 函数决定是否需要创建表
        tableColumns[migration.table] = [];
      } else {
        const columns = db.prepare(`PRAGMA table_info(${migration.table})`).all();
        tableColumns[migration.table] = columns.map(col => col.name);
      }
    }
    
    // 检查是否需要应用迁移
    if (migration.check(tableColumns[migration.table], db)) {
      console.log(`✓ 应用迁移: ${migration.name}`);
      db.exec(migration.sql);
      appliedCount++;
      
      // 更新缓存的列信息
      const columns = db.prepare(`PRAGMA table_info(${migration.table})`).all();
      tableColumns[migration.table] = columns.map(col => col.name);
    } else {
      console.log(`- 跳过: ${migration.name} (已存在)`);
      skippedCount++;
    }
  }
  
  db.close();
  
  console.log('\n========================================');
  if (appliedCount > 0) {
    console.log(`✓ 迁移完成！应用了 ${appliedCount} 个迁移，跳过 ${skippedCount} 个`);
  } else {
    console.log(`✓ 数据库已是最新版本 (跳过 ${skippedCount} 个迁移)`);
  }
  console.log('========================================');
  
} catch (error) {
  console.error('\n✗ 数据库迁移失败:', error);
  process.exit(1);
}
