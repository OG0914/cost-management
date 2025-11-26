-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly')),
  real_name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 法规类别表
CREATE TABLE IF NOT EXISTS regulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 型号表
CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  regulation_id INTEGER NOT NULL,
  model_name TEXT NOT NULL,
  remark TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (regulation_id) REFERENCES regulations(id)
);

-- 原料表
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  model_id INTEGER,
  usage_amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

-- 工序表
CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  model_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

-- 包材表（旧表，保留用于兼容）
CREATE TABLE IF NOT EXISTS packaging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  usage_amount REAL NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  model_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

-- 包装配置表（型号+包装方式的固定组合）
CREATE TABLE IF NOT EXISTS packaging_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  config_name TEXT NOT NULL,
  pc_per_bag INTEGER NOT NULL,
  bags_per_box INTEGER NOT NULL,
  boxes_per_carton INTEGER NOT NULL,
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
  process_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
);

-- 包材配置表（与包装配置关联的包材明细）
CREATE TABLE IF NOT EXISTS packaging_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_config_id INTEGER NOT NULL,
  material_name TEXT NOT NULL,
  basic_usage REAL NOT NULL,
  unit_price REAL NOT NULL,
  carton_volume REAL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
);

-- 报价单主表
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_region TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  regulation_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  freight_total REAL NOT NULL,
  freight_per_unit REAL NOT NULL,
  sales_type TEXT NOT NULL CHECK(sales_type IN ('domestic', 'export')),
  shipping_method TEXT,
  port TEXT,
  base_cost REAL NOT NULL,
  overhead_price REAL NOT NULL,
  final_price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by INTEGER NOT NULL,
  reviewed_by INTEGER,
  packaging_config_id INTEGER,
  include_freight_in_base BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (regulation_id) REFERENCES regulations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id)
);

-- 报价单明细表
CREATE TABLE IF NOT EXISTS quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('material', 'process', 'packaging')),
  item_name TEXT NOT NULL,
  usage_amount REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  is_changed BOOLEAN DEFAULT 0,
  original_value REAL,
  material_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- 批注表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL CHECK(item_type IN ('material', 'process', 'packaging')),
  item_id INTEGER NOT NULL,
  old_price REAL NOT NULL,
  new_price REAL NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 插入默认系统配置
INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES
('overhead_rate', '0.2', '管销率'),
('vat_rate', '0.13', '增值税率'),
('insurance_rate', '0.003', '保险率'),
('exchange_rate', '7.2', '汇率（CNY/USD）'),
('profit_tiers', '[0.05, 0.10, 0.25, 0.50]', '利润区间');

-- 插入默认管理员账号（密码: admin123，需要在实际使用时通过 bcrypt 加密）
-- 注意：这里的密码是明文，实际部署时需要通过后端 API 创建加密后的管理员账号
INSERT OR IGNORE INTO users (username, password, role, real_name, email) VALUES
('admin', '$2b$10$placeholder', 'admin', '系统管理员', 'admin@example.com');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_models_regulation_id ON models(regulation_id);
CREATE INDEX IF NOT EXISTS idx_materials_item_no ON materials(item_no);
CREATE INDEX IF NOT EXISTS idx_materials_model_id ON materials(model_id);
CREATE INDEX IF NOT EXISTS idx_processes_model_id ON processes(model_id);
CREATE INDEX IF NOT EXISTS idx_packaging_model_id ON packaging(model_id);
CREATE INDEX IF NOT EXISTS idx_packaging_configs_model_id ON packaging_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_process_configs_packaging_config_id ON process_configs(packaging_config_id);
CREATE INDEX IF NOT EXISTS idx_packaging_materials_config_id ON packaging_materials(packaging_config_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_comments_quotation_id ON comments(quotation_id);
