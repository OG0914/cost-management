-- ============================================
-- 物料价格变更提醒系统
-- ============================================

-- 物料价格变更记录表（扩展price_history，记录受影响的实体）
CREATE TABLE IF NOT EXISTS material_price_changes (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  old_price DECIMAL(12,4) NOT NULL,
  new_price DECIMAL(12,4) NOT NULL,
  price_change_rate DECIMAL(8,6), -- 价格变动百分比
  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  is_processed BOOLEAN DEFAULT false -- 是否已处理（生成提醒）
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_price_changes_material_id ON material_price_changes(material_id);
CREATE INDEX IF NOT EXISTS idx_price_changes_changed_at ON material_price_changes(changed_at);
CREATE INDEX IF NOT EXISTS idx_price_changes_is_processed ON material_price_changes(is_processed) WHERE is_processed = false;

-- 提醒记录表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK(type IN ('material_price_changed', 'system', 'review')),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  -- 关联信息
  material_id INTEGER REFERENCES materials(id), -- 物料ID（当type=material_price_changed时）
  price_change_id INTEGER REFERENCES material_price_changes(id), -- 价格变更记录ID
  model_id INTEGER REFERENCES models(id), -- 受影响的型号ID
  standard_cost_id INTEGER REFERENCES standard_costs(id), -- 受影响的标准成本ID
  quotation_id INTEGER REFERENCES quotations(id), -- 受影响的报价单ID
  -- 目标用户
  user_id INTEGER REFERENCES users(id), -- 指定用户（null表示所有用户）
  role VARCHAR(20), -- 指定角色（null表示所有角色）
  -- 状态
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false, -- 是否被用户关闭
  read_at TIMESTAMP,
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- 过期时间（可选）
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_material_id ON notifications(material_id) WHERE material_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_model_id ON notifications(model_id) WHERE model_id IS NOT NULL;

-- 用户通知状态表（记录用户已读/关闭的通知）
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);

-- 物料与型号BOM关联视图（用于快速查询物料被哪些型号使用）
CREATE OR REPLACE VIEW material_model_usage AS
SELECT 
  m.id as material_id,
  m.item_no as material_item_no,
  m.name as material_name,
  m.price as current_price,
  model.id as model_id,
  model.model_name,
  model.regulation_id,
  r.name as regulation_name,
  b.usage_amount,
  b.is_active as bom_is_active
FROM materials m
JOIN model_bom_materials b ON m.id = b.material_id
JOIN models model ON b.model_id = model.id
LEFT JOIN regulations r ON model.regulation_id = r.id
WHERE b.is_active = true;

-- 物料与标准成本关联视图（用于快速查询物料被哪些标准成本使用）
CREATE OR REPLACE VIEW material_standard_cost_usage AS
SELECT DISTINCT
  m.id as material_id,
  m.item_no as material_item_no,
  m.name as material_name,
  sc.id as standard_cost_id,
  sc.packaging_config_id,
  pc.config_name as packaging_config_name,
  pc.model_id,
  model.model_name,
  sc.sales_type,
  sc.is_current
FROM materials m
JOIN model_bom_materials b ON m.id = b.material_id
JOIN models model ON b.model_id = model.id
JOIN packaging_configs pc ON model.id = pc.model_id
JOIN standard_costs sc ON pc.id = sc.packaging_config_id
WHERE b.is_active = true AND sc.is_current = true;

-- 物料与报价单关联视图（用于快速查询物料被哪些报价单使用）
CREATE OR REPLACE VIEW material_quotation_usage AS
SELECT DISTINCT
  m.id as material_id,
  m.item_no as material_item_no,
  m.name as material_name,
  q.id as quotation_id,
  q.quotation_no,
  q.model_id,
  model.model_name,
  q.status,
  q.created_by
FROM materials m
JOIN model_bom_materials b ON m.id = b.material_id
JOIN models model ON b.model_id = model.id
JOIN quotations q ON model.id = q.model_id
WHERE b.is_active = true;

COMMENT ON TABLE material_price_changes IS '物料价格变更记录表';
COMMENT ON TABLE notifications IS '系统通知/提醒表';
COMMENT ON TABLE user_notifications IS '用户通知状态表';
