-- 012_add_factory_and_cif_config.sql
-- 添加 factory 字段到 packaging_configs 表，支持 CIF 深圳运费计算

-- 1. 在 packaging_configs 表添加 factory 字段（供应商：湖北知腾/东莞迅安）
ALTER TABLE packaging_configs 
ADD COLUMN IF NOT EXISTS factory VARCHAR(50) DEFAULT 'dongguan_xunan';

-- 添加约束检查（PostgreSQL 语法）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packaging_configs_factory_check'
  ) THEN
    ALTER TABLE packaging_configs 
    ADD CONSTRAINT packaging_configs_factory_check 
    CHECK (factory IN ('hubei_zhiteng', 'dongguan_xunan'));
  END IF;
END $$;

-- 2. 在 quotations 表扩展 port_type 支持 cif_shenzhen
-- 先删除旧约束，再添加新约束
DO $$
BEGIN
  -- 检查并更新 shipping_method 约束
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'shipping_method'
  ) THEN
    -- 删除旧约束（如果存在）
    ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_shipping_method_check;
    -- 添加新约束，包含 cif_lcl
    ALTER TABLE quotations 
    ADD CONSTRAINT quotations_shipping_method_check 
    CHECK (shipping_method IN ('fcl', 'fcl_20', 'fcl_40', 'lcl', 'cif_lcl'));
  END IF;
END $$;

-- 3. 添加 CIF 深圳相关系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_shenzhen_cfs_per_cbm', '60', 'CIF深圳 CFS费用(RMB/CBM)')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_shenzhen_doc_fee', '500', 'CIF深圳 文件费(RMB)')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_shenzhen_customs_fee', '400', 'CIF深圳 报关费(RMB)')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_shenzhen_warehouse_fee', '130', 'CIF深圳 仓库费(RMB)')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_shenzhen_seafreight_usd', '10', 'CIF深圳 海运费(USD/CBM)')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_config (config_key, config_value, description) VALUES
  ('cif_hubei_truck_per_cbm', '400', '湖北知腾卡车费(RMB/CBM)')
ON CONFLICT (config_key) DO NOTHING;

-- 4. 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_packaging_configs_factory ON packaging_configs(factory);
