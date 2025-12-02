-- 将 models 表的 remark 字段重命名为 model_category（型号分类）
-- 用于区分口罩、半面罩等类型

-- SQLite 不支持直接重命名列，需要通过重建表的方式
-- 1. 创建新表
CREATE TABLE IF NOT EXISTS models_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  regulation_id INTEGER NOT NULL,
  model_name TEXT NOT NULL,
  model_category TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (regulation_id) REFERENCES regulations(id)
);

-- 2. 复制数据（将 remark 映射到 model_category）
INSERT INTO models_new (id, regulation_id, model_name, model_category, is_active, created_at, updated_at)
SELECT id, regulation_id, model_name, remark, is_active, created_at, updated_at
FROM models;

-- 3. 删除旧表
DROP TABLE models;

-- 4. 重命名新表
ALTER TABLE models_new RENAME TO models;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_models_regulation_id ON models(regulation_id);
