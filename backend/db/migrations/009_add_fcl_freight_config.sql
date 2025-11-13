-- 添加整柜运费配置项
-- 20尺整柜运费（美金）
INSERT OR IGNORE INTO system_config (config_key, config_value, description, updated_at)
VALUES ('fcl_20_freight_usd', '840', '20尺整柜FOB深圳运费（美金）', CURRENT_TIMESTAMP);

-- 40尺整柜运费（美金）
INSERT OR IGNORE INTO system_config (config_key, config_value, description, updated_at)
VALUES ('fcl_40_freight_usd', '940', '40尺整柜FOB深圳运费（美金）', CURRENT_TIMESTAMP);
