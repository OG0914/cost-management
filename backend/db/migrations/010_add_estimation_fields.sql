-- 新产品成本预估功能 - 报价单表新增字段
-- 添加 is_estimation 标识和 reference_standard_cost_id 关联

-- 添加预估标识字段
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_estimation BOOLEAN DEFAULT false;

-- 添加参考标准成本ID字段
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS reference_standard_cost_id INTEGER REFERENCES standard_costs(id);

-- 创建索引以优化按预估类型筛选的查询
CREATE INDEX IF NOT EXISTS idx_quotations_is_estimation ON quotations(is_estimation);

-- 添加注释
COMMENT ON COLUMN quotations.is_estimation IS '是否为新产品成本预估报价单';
COMMENT ON COLUMN quotations.reference_standard_cost_id IS '参考标准成本ID，用于追溯预估数据来源';
