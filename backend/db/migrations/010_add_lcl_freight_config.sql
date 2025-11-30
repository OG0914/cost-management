-- 添加散货（LCL）运费配置项
-- 基础运费（按CBM区间）
INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_base_freight_1_3', '800', '散货基础运费：1-3 CBM（人民币）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_base_freight_4_10', '1000', '散货基础运费：4-10 CBM（人民币）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_base_freight_11_15', '1500', '散货基础运费：11-15 CBM（人民币）');

-- 固定费用
INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_handling_charge', '500', '散货操作费（Handling charge）（人民币）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_cfs_per_cbm', '170', '散货拼箱费（CFS）每CBM单价（人民币）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('lcl_document_fee', '500', '散货文件费（人民币）');
