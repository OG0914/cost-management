-- 添加 vat_rate 字段到 quotations 表
-- 允许用户在报价单级别覆盖系统全局增值税率
-- NULL 表示使用系统全局配置的增值税率

ALTER TABLE quotations ADD COLUMN vat_rate REAL DEFAULT NULL;

-- 注意：vat_rate 的值应该在 0 到 1 之间（如 0.13 表示 13%）
-- 验证逻辑在应用层实现
