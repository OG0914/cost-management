-- 为原料表添加品号字段的迁移脚本
-- 运行此脚本前请备份数据库

-- 1. 创建新表结构
CREATE TABLE IF NOT EXISTS materials_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  model_id INTEGER,
  usage_amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

-- 2. 复制旧数据（为旧数据生成品号）
INSERT INTO materials_new (id, item_no, name, unit, price, currency, model_id, usage_amount, created_at, updated_at)
SELECT 
  id, 
  'MAT' || printf('%05d', id) as item_no,  -- 自动生成品号：MAT00001, MAT00002...
  name, 
  unit, 
  price, 
  currency, 
  model_id, 
  usage_amount, 
  created_at, 
  updated_at
FROM materials;

-- 3. 删除旧表
DROP TABLE materials;

-- 4. 重命名新表
ALTER TABLE materials_new RENAME TO materials;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_item_no ON materials(item_no);
CREATE INDEX IF NOT EXISTS idx_materials_model_id ON materials(model_id);
