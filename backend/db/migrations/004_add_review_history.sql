-- 审核历史表迁移脚本
-- 用于记录报价单的审核流程历史

-- ============================================
-- 审核历史表
-- ============================================
CREATE TABLE IF NOT EXISTS review_history (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK(action IN ('created', 'submitted', 'approved', 'rejected', 'resubmitted')),
  operator_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_review_history_quotation ON review_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_review_history_action ON review_history(action);
CREATE INDEX IF NOT EXISTS idx_review_history_created_at ON review_history(created_at DESC);

-- 记录迁移
INSERT INTO migrations (name) VALUES ('004_add_review_history')
ON CONFLICT (name) DO NOTHING;
