-- 创建标准成本表
CREATE TABLE IF NOT EXISTS standard_costs (
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
  UNIQUE(packaging_config_id, version)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
CREATE INDEX IF NOT EXISTS idx_standard_costs_is_current ON standard_costs(is_current);
