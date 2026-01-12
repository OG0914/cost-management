-- 性能优化迁移：添加索引和软删除字段

-- 1. 复合索引：报价单状态+创建时间（常用查询组合）
CREATE INDEX IF NOT EXISTS idx_quotations_status_created 
  ON quotations(status, created_at DESC);

-- 2. 复合索引：BOM原料活跃状态查询
CREATE INDEX IF NOT EXISTS idx_bom_model_active 
  ON model_bom_materials(model_id, is_active) WHERE is_active = true;

-- 3. 软删除字段：报价单表
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 4. 软删除字段：原料表
ALTER TABLE materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 5. 软删除索引（用于过滤已删除记录）
CREATE INDEX IF NOT EXISTS idx_quotations_deleted 
  ON quotations(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_materials_deleted 
  ON materials(deleted_at) WHERE deleted_at IS NULL;
