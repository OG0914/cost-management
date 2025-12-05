-- 创建报价单自定义费用表
-- 用于存储管销后的自定义费用项（如关税、服务费等）

CREATE TABLE IF NOT EXISTS quotation_custom_fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  fee_name TEXT NOT NULL,
  fee_rate REAL NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_custom_fees_quotation ON quotation_custom_fees(quotation_id);
