-- 产品BOM表迁移脚本
-- 用于存储型号级别的原料清单（物料清单）

-- ============================================
-- 产品BOM表
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_bom_model_id ON model_bom_materials(model_id);
CREATE INDEX IF NOT EXISTS idx_bom_material_id ON model_bom_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_bom_is_active ON model_bom_materials(is_active) WHERE is_active = true;

-- 记录迁移
INSERT INTO migrations (name) VALUES ('005_add_model_bom')
ON CONFLICT (name) DO NOTHING;
