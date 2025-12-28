-- 客户管理表
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    vc_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_customers_vc_code ON customers(vc_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 报价单表新增 customer_id 外键（可选关联）
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
