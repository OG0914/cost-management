-- 014: 新增生产周期字段
-- 用于半面罩类原料，存储如 "15天"、"2周" 等时长信息

ALTER TABLE materials ADD COLUMN IF NOT EXISTS production_cycle VARCHAR(50);

COMMENT ON COLUMN materials.production_cycle IS '生产周期（半面罩类专用，如"15天"）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_production_cycle ON materials(production_cycle);
