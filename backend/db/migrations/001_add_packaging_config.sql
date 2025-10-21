-- 包装配置表（型号+包装方式的固定组合）
CREATE TABLE IF NOT EXISTS packaging_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  config_name TEXT NOT NULL, -- 配置名称，如 "标准包装"
  pc_per_bag INTEGER NOT NULL, -- 每袋多少个
  bags_per_box INTEGER NOT NULL, -- 每箱多少袋
  boxes_per_carton INTEGER NOT NULL, -- 每纸箱多少箱
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id),
  UNIQUE(model_id, config_name)
);

-- 工序配置表（每个包装配置对应的工序列表）
CREATE TABLE IF NOT EXISTS process_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_config_id INTEGER NOT NULL,
  process_name TEXT NOT NULL, -- 工序名称
  unit_price REAL NOT NULL, -- 单价
  sort_order INTEGER DEFAULT 0, -- 排序
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_packaging_configs_model_id ON packaging_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_process_configs_packaging_config_id ON process_configs(packaging_config_id);
