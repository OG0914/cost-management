-- 添加用户 is_active 字段
-- 用于启用/禁用用户账号

-- 检查列是否存在，如果不存在则添加
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- 更新现有用户为启用状态
UPDATE users SET is_active = 1 WHERE is_active IS NULL;
