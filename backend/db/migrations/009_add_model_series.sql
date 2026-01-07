-- 迁移脚本：为 models 表添加 model_series 字段
-- 用途：支持按产品系列批量更新标准成本
-- 执行：本脚本应在数据库已存在的情况下执行

-- 添加 model_series 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'model_series'
  ) THEN
    ALTER TABLE models ADD COLUMN model_series VARCHAR(50);
  END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_models_series ON models(model_series);

-- 记录迁移（如果有迁移表）
INSERT INTO migrations (name) 
VALUES ('009_add_model_series')
ON CONFLICT (name) DO NOTHING;
