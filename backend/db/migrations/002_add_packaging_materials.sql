-- 包材配置表（与包装配置关联的包材明细）
CREATE TABLE IF NOT EXISTS packaging_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_config_id INTEGER NOT NULL,
  material_name TEXT NOT NULL, -- 包材名称
  basic_usage REAL NOT NULL, -- 基本用量
  unit_price REAL NOT NULL, -- 单价
  carton_volume REAL, -- 外箱材积（立方米）
  sort_order INTEGER DEFAULT 0, -- 排序
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_packaging_materials_config_id ON packaging_materials(packaging_config_id);
