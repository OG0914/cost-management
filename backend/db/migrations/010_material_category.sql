-- 原料类别功能迁移
-- 2026-01-09

-- 1. 为materials表添加category字段
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 2. 添加原料类别配置到system_config（空数组，由用户自行配置）
INSERT INTO system_config (config_key, config_value, description)
VALUES ('material_categories', '[]', '原料类别配置')
ON CONFLICT (config_key) DO NOTHING;

-- 3. 创建索引优化按类别查询
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
