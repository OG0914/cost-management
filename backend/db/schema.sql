-- PostgreSQL Schema for Cost Analysis System
-- Converted from SQLite to PostgreSQL

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly')),
  real_name VARCHAR(100),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 法规类别表
-- ============================================
CREATE TABLE IF NOT EXISTS regulations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 型号表
-- ============================================
CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  regulation_id INTEGER NOT NULL REFERENCES regulations(id),
  model_name VARCHAR(200) NOT NULL,
  model_category VARCHAR(100),
  model_series VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 原料表
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  item_no VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  manufacturer VARCHAR(200),
  usage_amount DECIMAL(12,6),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 工序表（旧表，保留用于兼容）
-- ============================================
CREATE TABLE IF NOT EXISTS processes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  model_id INTEGER NOT NULL REFERENCES models(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 包材表（旧表，保留用于兼容）
-- ============================================
CREATE TABLE IF NOT EXISTS packaging (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  usage_amount DECIMAL(12,6) NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  model_id INTEGER NOT NULL REFERENCES models(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 包装配置表（型号+包装方式的固定组合）
-- ============================================
CREATE TABLE IF NOT EXISTS packaging_configs (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id),
  config_name VARCHAR(200) NOT NULL,
  pc_per_bag INTEGER NOT NULL,
  bags_per_box INTEGER NOT NULL,
  boxes_per_carton INTEGER NOT NULL,
  packaging_type VARCHAR(20) NOT NULL DEFAULT 'standard_box' CHECK(packaging_type IN ('standard_box', 'no_box', 'blister_direct', 'blister_bag')),
  layer1_qty INTEGER NOT NULL,
  layer2_qty INTEGER NOT NULL,
  layer3_qty INTEGER,
  factory VARCHAR(50) DEFAULT 'dongguan_xunan' CHECK(factory IN ('hubei_zhiteng', 'dongguan_xunan')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, config_name)
);

-- ============================================
-- 工序配置表（每个包装配置对应的工序列表）
-- ============================================
CREATE TABLE IF NOT EXISTS process_configs (
  id SERIAL PRIMARY KEY,
  packaging_config_id INTEGER NOT NULL REFERENCES packaging_configs(id) ON DELETE CASCADE,
  process_name VARCHAR(200) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 包材配置表（与包装配置关联的包材明细）
-- ============================================
CREATE TABLE IF NOT EXISTS packaging_materials (
  id SERIAL PRIMARY KEY,
  packaging_config_id INTEGER NOT NULL REFERENCES packaging_configs(id) ON DELETE CASCADE,
  material_name VARCHAR(200) NOT NULL,
  basic_usage DECIMAL(12,6) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  carton_volume DECIMAL(12,6),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 客户管理表
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  vc_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 报价单主表
-- ============================================
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_no VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(200) NOT NULL,
  customer_region VARCHAR(100) NOT NULL,
  model_id INTEGER NOT NULL REFERENCES models(id),
  regulation_id INTEGER NOT NULL REFERENCES regulations(id),
  quantity INTEGER NOT NULL,
  freight_total DECIMAL(12,4) NOT NULL,
  freight_per_unit DECIMAL(12,4) NOT NULL,
  sales_type VARCHAR(20) NOT NULL CHECK(sales_type IN ('domestic', 'export')),
  shipping_method VARCHAR(20) CHECK(shipping_method IN ('fcl', 'fcl_20', 'fcl_40', 'lcl', 'cif_lcl')),
  port VARCHAR(100),
  base_cost DECIMAL(12,4) NOT NULL,
  overhead_price DECIMAL(12,4) NOT NULL,
  final_price DECIMAL(12,4) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  packaging_config_id INTEGER REFERENCES packaging_configs(id),
  customer_id INTEGER REFERENCES customers(id),
  include_freight_in_base BOOLEAN DEFAULT true,
  custom_profit_tiers TEXT,
  vat_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- ============================================
-- 报价单明细表
-- ============================================
CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK(category IN ('material', 'process', 'packaging')),
  item_name VARCHAR(200) NOT NULL,
  usage_amount DECIMAL(12,6) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  subtotal DECIMAL(12,4) NOT NULL,
  is_changed BOOLEAN DEFAULT false,
  original_value DECIMAL(12,4),
  material_id INTEGER REFERENCES materials(id),
  after_overhead BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 报价单自定义费用表
-- ============================================
CREATE TABLE IF NOT EXISTS quotation_custom_fees (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  fee_name VARCHAR(200) NOT NULL,
  fee_rate DECIMAL(8,6) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 批注表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 产品BOM表（型号级别的原料清单）
-- ============================================
CREATE TABLE IF NOT EXISTS model_bom_materials (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  usage_amount DECIMAL(12,6) NOT NULL CHECK(usage_amount > 0),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, material_id)
);

-- ============================================
-- 审核历史表
-- ============================================
CREATE TABLE IF NOT EXISTS review_history (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK(action IN ('created', 'submitted', 'approved', 'rejected', 'resubmitted')),
  operator_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 价格历史表
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK(item_type IN ('material', 'process', 'packaging')),
  item_id INTEGER NOT NULL,
  old_price DECIMAL(12,4) NOT NULL,
  new_price DECIMAL(12,4) NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 标准成本表
-- ============================================
CREATE TABLE IF NOT EXISTS standard_costs (
  id SERIAL PRIMARY KEY,
  packaging_config_id INTEGER NOT NULL REFERENCES packaging_configs(id),
  quotation_id INTEGER NOT NULL REFERENCES quotations(id),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  base_cost DECIMAL(12,4) NOT NULL,
  overhead_price DECIMAL(12,4) NOT NULL,
  domestic_price DECIMAL(12,4),
  export_price DECIMAL(12,4),
  quantity INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  sales_type VARCHAR(20) NOT NULL,
  set_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(packaging_config_id, sales_type, version)
);

-- ============================================
-- 迁移记录表（用于跟踪已执行的迁移）
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 索引定义
-- ============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 型号表索引
CREATE INDEX IF NOT EXISTS idx_models_regulation_id ON models(regulation_id);
CREATE INDEX IF NOT EXISTS idx_models_series ON models(model_series);

-- 原料表索引
CREATE INDEX IF NOT EXISTS idx_materials_item_no ON materials(item_no);
CREATE INDEX IF NOT EXISTS idx_materials_manufacturer ON materials(manufacturer);

-- 工序表索引（旧表）
CREATE INDEX IF NOT EXISTS idx_processes_model_id ON processes(model_id);

-- 包材表索引（旧表）
CREATE INDEX IF NOT EXISTS idx_packaging_model_id ON packaging(model_id);

-- 包装配置表索引
CREATE INDEX IF NOT EXISTS idx_packaging_configs_model_id ON packaging_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_packaging_configs_type ON packaging_configs(packaging_type);

-- 工序配置表索引
CREATE INDEX IF NOT EXISTS idx_process_configs_packaging_config_id ON process_configs(packaging_config_id);

-- 包材配置表索引
CREATE INDEX IF NOT EXISTS idx_packaging_materials_config_id ON packaging_materials(packaging_config_id);

-- 产品BOM表索引
CREATE INDEX IF NOT EXISTS idx_bom_model_id ON model_bom_materials(model_id);
CREATE INDEX IF NOT EXISTS idx_bom_material_id ON model_bom_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_bom_is_active ON model_bom_materials(is_active) WHERE is_active = true;

-- 报价单表索引
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_name);

-- 报价单明细表索引
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_category ON quotation_items(category);

-- 批注表索引
CREATE INDEX IF NOT EXISTS idx_comments_quotation_id ON comments(quotation_id);

-- 审核历史表索引
CREATE INDEX IF NOT EXISTS idx_review_history_quotation ON review_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_review_history_action ON review_history(action);
CREATE INDEX IF NOT EXISTS idx_review_history_created_at ON review_history(created_at DESC);

-- 客户表索引
CREATE INDEX IF NOT EXISTS idx_customers_vc_code ON customers(vc_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 自定义费用表索引
CREATE INDEX IF NOT EXISTS idx_custom_fees_quotation ON quotation_custom_fees(quotation_id);

-- 标准成本表索引
CREATE INDEX IF NOT EXISTS idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
CREATE INDEX IF NOT EXISTS idx_standard_costs_sales_type ON standard_costs(sales_type);

-- 标准成本表部分索引（仅索引当前版本）
CREATE INDEX IF NOT EXISTS idx_standard_costs_is_current ON standard_costs(is_current) WHERE is_current = true;


-- ============================================
-- 默认系统配置数据
-- ============================================
INSERT INTO system_config (config_key, config_value, description) VALUES
('overhead_rate', '0.2', '管销率'),
('vat_rate', '0.13', '增值税率'),
('vat_rate_options', '[0.13, 0.10]', '增值税率选项列表'),
('insurance_rate', '0.003', '保险率'),
('exchange_rate', '7.2', '汇率（CNY/USD）'),
('profit_tiers', '[0.05, 0.10, 0.25, 0.50]', '利润区间'),
('fob_shenzhen_exchange_rate', '7.1', 'FOB深圳运费汇率（USD/CNY）'),
('fcl_20_freight_usd', '840', '20尺整柜FOB深圳运费（美金）'),
('fcl_40_freight_usd', '940', '40尺整柜FOB深圳运费（美金）'),
('lcl_base_freight_1_3', '800', '散货基础运费：1-3 CBM（人民币）'),
('lcl_base_freight_4_10', '1000', '散货基础运费：4-10 CBM（人民币）'),
('lcl_base_freight_11_15', '1500', '散货基础运费：11-15 CBM（人民币）'),
('lcl_handling_charge', '500', '散货操作费（Handling charge）（人民币）'),
('lcl_cfs_per_cbm', '170', '散货拼箱费（CFS）每CBM单价（人民币）'),
('lcl_document_fee', '500', '散货文件费（人民币）'),
('material_coefficients', '{"口罩": 0.97, "半面罩": 0.99}', '原料系数配置，按型号分类映射')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- 默认管理员账号
-- 注意：密码是占位符，实际部署时需要通过后端 API 创建加密后的管理员账号
-- ============================================
INSERT INTO users (username, password, role, real_name, email) VALUES
('admin', '$2b$10$placeholder', 'admin', '系统管理员', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;
