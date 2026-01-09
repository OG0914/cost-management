-- 客户归属业务员关系
-- 每个客户只能归属一个业务员

-- 添加 user_id 字段
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 添加注释
COMMENT ON COLUMN customers.user_id IS '负责业务员ID，NULL表示公共客户';
