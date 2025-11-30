-- 添加 after_overhead 字段到 quotation_items 表
-- 用于标记原料是否在管销后计算

-- 检查字段是否已存在，如果不存在则添加
-- SQLite 不支持 IF NOT EXISTS，所以需要在应用层处理

ALTER TABLE quotation_items ADD COLUMN after_overhead BOOLEAN DEFAULT 0;
