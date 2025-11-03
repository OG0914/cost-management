-- 添加 material_id 字段到 quotation_items 表
-- 用于存储原料和包材的原料库ID，方便编辑时回显

ALTER TABLE quotation_items ADD COLUMN material_id INTEGER;

-- 添加 packaging_config_id 字段到 quotations 表
-- 用于记录使用的包装配置

ALTER TABLE quotations ADD COLUMN packaging_config_id INTEGER;

-- 添加外键索引
CREATE INDEX IF NOT EXISTS idx_quotation_items_material_id ON quotation_items(material_id);
CREATE INDEX IF NOT EXISTS idx_quotations_packaging_config_id ON quotations(packaging_config_id);
