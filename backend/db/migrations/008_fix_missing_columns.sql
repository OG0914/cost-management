-- 修复缺失的列（一次性迁移，合并后可删除）

-- 确保 customers 表存在
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  vc_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加 quotations.customer_id 列
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- 添加 packaging_configs 新字段
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS packaging_type VARCHAR(20) DEFAULT 'standard_box';
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer1_qty INTEGER;
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer2_qty INTEGER;
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer3_qty INTEGER;

-- 迁移旧数据到新字段
UPDATE packaging_configs SET layer1_qty = pc_per_bag, layer2_qty = bags_per_box, layer3_qty = boxes_per_carton WHERE layer1_qty IS NULL;

-- 确保 review_history 表存在
CREATE TABLE IF NOT EXISTS review_history (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK(action IN ('created', 'submitted', 'approved', 'rejected', 'resubmitted')),
  operator_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建缺失的索引
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_packaging_configs_type ON packaging_configs(packaging_type);
CREATE INDEX IF NOT EXISTS idx_customers_vc_code ON customers(vc_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_review_history_quotation ON review_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_review_history_action ON review_history(action);
CREATE INDEX IF NOT EXISTS idx_review_history_created_at ON review_history(created_at DESC);
