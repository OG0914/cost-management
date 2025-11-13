-- 更新shipping_method字段约束，支持40尺和20尺整柜
-- SQLite不支持直接修改CHECK约束，需要重建表

-- 1. 创建新表（保持与原表完全相同的列顺序和数量）
CREATE TABLE quotations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_region TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  regulation_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  freight_total REAL NOT NULL,
  freight_per_unit REAL NOT NULL,
  sales_type TEXT NOT NULL,
  base_cost REAL NOT NULL,
  overhead_price REAL NOT NULL,
  final_price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL,
  reviewed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  packaging_config_id INTEGER,
  include_freight_in_base BOOLEAN DEFAULT 1,
  shipping_method TEXT CHECK(shipping_method IN ('fcl', 'fcl_20', 'fcl_40', 'lcl') OR shipping_method IS NULL),
  port TEXT,
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (regulation_id) REFERENCES regulations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id)
);

-- 2. 复制数据
INSERT INTO quotations_new SELECT * FROM quotations;

-- 3. 删除旧表
DROP TABLE quotations;

-- 4. 重命名新表
ALTER TABLE quotations_new RENAME TO quotations;
