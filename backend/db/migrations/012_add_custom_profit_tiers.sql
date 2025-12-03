-- 添加自定义利润档位字段
-- 用于存储用户在报价单中自定义的利润档位

ALTER TABLE quotations ADD COLUMN custom_profit_tiers TEXT;

-- 添加注释
-- custom_profit_tiers: JSON格式存储自定义利润档位数组
-- 格式示例: [{"profitRate": 0.35, "profitPercentage": "35%", "price": 1234.56}]
