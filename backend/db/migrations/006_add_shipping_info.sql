-- 添加货运方式和港口字段到报价单表
ALTER TABLE quotations ADD COLUMN shipping_method TEXT CHECK(shipping_method IN ('fcl', 'lcl') OR shipping_method IS NULL);
ALTER TABLE quotations ADD COLUMN port TEXT;
