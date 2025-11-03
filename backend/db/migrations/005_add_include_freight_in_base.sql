-- 添加运费计入选项字段到 quotations 表
-- 用于控制运费是否计入基础成本价

ALTER TABLE quotations ADD COLUMN include_freight_in_base BOOLEAN DEFAULT 1;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_quotations_include_freight ON quotations(include_freight_in_base);
