-- 修改标准成本表的唯一约束
-- 将 (packaging_config_id, version) 改为 (packaging_config_id, sales_type, version)
-- 这样同一型号配置可以有内销和外销两个独立的标准成本

-- SQLite 不支持直接修改约束，需要重建表

-- 1. 创建临时表
CREATE TABLE IF NOT EXISTS standard_costs_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_config_id INTEGER NOT NULL,
  quotation_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER DEFAULT 1,
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
  UNIQUE(packaging_config_id, sales_type, version)
);

-- 2. 复制数据
INSERT INTO standard_costs_temp (id, packaging_config_id, quotation_id, version, is_current, base_cost, overhead_price, domestic_price, export_price, quantity, currency, sales_type, set_by, created_at)
SELECT id, packaging_config_id, quotation_id, version, is_current, base_cost, overhead_price, domestic_price, export_price, quantity, currency, sales_type, set_by, created_at
FROM standard_costs;

-- 3. 删除旧表
DROP TABLE standard_costs;

-- 4. 重命名临时表
ALTER TABLE standard_costs_temp RENAME TO standard_costs;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
CREATE INDEX IF NOT EXISTS idx_standard_costs_is_current ON standard_costs(is_current);
CREATE INDEX IF NOT EXISTS idx_standard_costs_sales_type ON standard_costs(sales_type);
