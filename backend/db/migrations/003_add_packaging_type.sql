-- Migration: 003_add_packaging_type
-- Description: 添加包装类型支持，扩展 packaging_configs 表
-- Date: 2024-12-07

-- ============================================
-- Step 1: 添加 packaging_type 字段
-- ============================================
ALTER TABLE packaging_configs 
ADD COLUMN IF NOT EXISTS packaging_type VARCHAR(20) NOT NULL DEFAULT 'standard_box';

-- 添加 CHECK 约束限制有效值
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_packaging_type'
  ) THEN
    ALTER TABLE packaging_configs 
    ADD CONSTRAINT chk_packaging_type 
    CHECK (packaging_type IN ('standard_box', 'no_box', 'blister_direct', 'blister_bag'));
  END IF;
END $$;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_packaging_configs_type ON packaging_configs(packaging_type);

-- ============================================
-- Step 2: 重命名字段 (使用新列+数据迁移方式)
-- ============================================

-- 添加新列
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer1_qty INTEGER;
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer2_qty INTEGER;
ALTER TABLE packaging_configs ADD COLUMN IF NOT EXISTS layer3_qty INTEGER;

-- 迁移数据：从旧列复制到新列
UPDATE packaging_configs 
SET layer1_qty = pc_per_bag,
    layer2_qty = bags_per_box,
    layer3_qty = boxes_per_carton
WHERE layer1_qty IS NULL;

-- 设置 layer1_qty 和 layer2_qty 为 NOT NULL（所有类型都需要）
-- 注意：先确保数据已迁移
DO $$
BEGIN
  -- 检查是否有数据需要迁移
  IF EXISTS (SELECT 1 FROM packaging_configs WHERE layer1_qty IS NULL) THEN
    UPDATE packaging_configs 
    SET layer1_qty = COALESCE(pc_per_bag, 1),
        layer2_qty = COALESCE(bags_per_box, 1),
        layer3_qty = COALESCE(boxes_per_carton, 1)
    WHERE layer1_qty IS NULL;
  END IF;
END $$;

-- 设置约束
ALTER TABLE packaging_configs ALTER COLUMN layer1_qty SET NOT NULL;
ALTER TABLE packaging_configs ALTER COLUMN layer2_qty SET NOT NULL;
-- layer3_qty 保持可为 NULL（2层包装类型不需要）

-- ============================================
-- Step 3: 数据迁移 - 设置现有配置的包装类型
-- ============================================
-- 所有现有配置默认为 standard_box（已通过 DEFAULT 值设置）
-- 此处仅作为显式确认
UPDATE packaging_configs 
SET packaging_type = 'standard_box' 
WHERE packaging_type IS NULL OR packaging_type = '';

-- ============================================
-- Step 4: 记录迁移
-- ============================================
INSERT INTO migrations (name, executed_at) 
VALUES ('003_add_packaging_type', NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 验证迁移结果
-- ============================================
-- 可以运行以下查询验证：
-- SELECT id, config_name, packaging_type, layer1_qty, layer2_qty, layer3_qty, pc_per_bag, bags_per_box, boxes_per_carton FROM packaging_configs;
