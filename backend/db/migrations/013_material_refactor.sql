-- 原料管理重构迁移脚本
-- 方案A：统一表 + 动态显示
-- 添加新字段以支持半面罩类和非半面罩类原料的不同属性

-- 原料类型：half_mask（半面罩类）| general（非半面罩类/通用）
ALTER TABLE materials ADD COLUMN IF NOT EXISTS material_type VARCHAR(20) DEFAULT 'general';

-- 子分类：活性炭、配件、PP布、聚酯棉等（对应Excel工作表名称）
ALTER TABLE materials ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

-- 半面罩类专有字段
ALTER TABLE materials ADD COLUMN IF NOT EXISTS product_desc TEXT;          -- 产品描述
ALTER TABLE materials ADD COLUMN IF NOT EXISTS packaging_mode VARCHAR(50); -- 包装方式
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier VARCHAR(100);      -- 供应商
ALTER TABLE materials ADD COLUMN IF NOT EXISTS production_date DATE;       -- 生产日期
ALTER TABLE materials ADD COLUMN IF NOT EXISTS moq INT;                    -- 最小起订量

-- 非半面罩类专有字段（manufacturer已存在，对应"厂商"）
ALTER TABLE materials ADD COLUMN IF NOT EXISTS remark TEXT;                -- 备注

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_subcategory ON materials(subcategory);
CREATE INDEX IF NOT EXISTS idx_materials_type_subcategory ON materials(material_type, subcategory);

-- 添加注释
COMMENT ON COLUMN materials.material_type IS '原料类型：half_mask=半面罩类, general=非半面罩类';
COMMENT ON COLUMN materials.subcategory IS '子分类（对应Excel工作表名称）';
COMMENT ON COLUMN materials.product_desc IS '产品描述（半面罩类专用）';
COMMENT ON COLUMN materials.packaging_mode IS '包装方式（半面罩类专用）';
COMMENT ON COLUMN materials.supplier IS '供应商（半面罩类专用）';
COMMENT ON COLUMN materials.production_date IS '生产日期（半面罩类专用）';
COMMENT ON COLUMN materials.moq IS '最小起订量MOQ（半面罩类专用）';
COMMENT ON COLUMN materials.remark IS '备注（非半面罩类专用）';
