# Design Document

## Overview

本设计实现产品类别分类与标准成本管理功能。主要包括：
1. 利用现有型号表的 model_category 字段区分口罩/半面罩
2. 在系统配置表中添加原料系数映射配置
3. 新增标准成本表，支持版本管理
4. 修改前端页面，增加产品类别选择和标准成本Tab

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Vue.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  CostRecords.vue (修改)                                                      │
│  ├── 标准成本Tab (新增)                                                      │
│  │   ├── StandardCostList.vue (新增组件)                                    │
│  │   └── StandardCostHistory.vue (新增弹窗组件)                             │
│  └── 报价单记录Tab (现有)                                                    │
│                                                                              │
│  CostAdd.vue (修改)                                                          │
│  ├── ProductCategoryModal.vue (新增弹窗组件)                                │
│  └── 原料计算逻辑修改                                                        │
│                                                                              │
│  CostDetail.vue (修改)                                                       │
│  └── 设为标准成本按钮 (新增)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend (Node.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Routes                                                                      │
│  └── standardCostRoutes.js (新增)                                           │
│                                                                              │
│  Controllers                                                                 │
│  └── standardCostController.js (新增)                                       │
│                                                                              │
│  Models                                                                      │
│  ├── Model.js (修改 - 支持按 model_category 过滤)                           │
│  └── StandardCost.js (新增)                                                 │
│                                                                              │
│  Utils                                                                       │
│  └── costCalculator.js (修改 - 支持原料系数)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Database (SQLite)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  system_config (修改 - 增加 material_coefficients 配置)                     │
│  models (现有 - 已有 model_category 字段)                                   │
│  standard_costs (新增)                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 型号 API 修改

```
GET /api/models?model_category=口罩&regulation_id=2   按型号分类和法规过滤型号
GET /api/models/categories                            获取所有型号分类（去重）
```

### 2. 标准成本 API

```
GET    /api/standard-costs                          获取当前标准成本列表
GET    /api/standard-costs/:id                      获取标准成本详情
GET    /api/standard-costs/:id/history              获取标准成本历史版本
POST   /api/standard-costs                          设置标准成本 (管理员/审核人)
POST   /api/standard-costs/:id/restore/:version     恢复历史版本 (管理员/审核人)
DELETE /api/standard-costs/:packaging_config_id     删除标准成本 (管理员/审核人)
```

### 3. 系统配置 API

```
GET /api/config   获取系统配置（包含 material_coefficients）
```

## Data Models

### 1. system_config 表 (修改 - 增加配置项)

```sql
-- 新增原料系数配置
INSERT INTO system_config (config_key, config_value, description) VALUES 
('material_coefficients', '{"口罩": 0.97, "半面罩": 0.99}', '原料系数配置，按型号分类映射');
```

### 2. models 表 (现有，无需修改)

```sql
-- 已有 model_category 字段
-- model_category TEXT  -- 型号分类：口罩、半面罩等
```

### 3. standard_costs 表 (新增)

```sql
CREATE TABLE standard_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_config_id INTEGER NOT NULL,   -- 关联包装配置
  quotation_id INTEGER NOT NULL,          -- 来源报价单
  version INTEGER NOT NULL DEFAULT 1,     -- 版本号
  is_current BOOLEAN DEFAULT 1,           -- 是否当前版本
  base_cost REAL NOT NULL,                -- 基础成本价
  overhead_price REAL NOT NULL,           -- 管销价
  domestic_price REAL,                    -- 内销价
  export_price REAL,                      -- 外销价
  quantity INTEGER NOT NULL,              -- 数量
  currency TEXT DEFAULT 'CNY',            -- 货币
  sales_type TEXT NOT NULL,               -- 销售类型
  set_by INTEGER NOT NULL,                -- 设置人
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id),
  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  FOREIGN KEY (set_by) REFERENCES users(id),
  UNIQUE(packaging_config_id, version)
);

-- 索引
CREATE INDEX idx_standard_costs_packaging_config ON standard_costs(packaging_config_id);
CREATE INDEX idx_standard_costs_is_current ON standard_costs(is_current);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Model filtering by model_category and regulation
*For any* combination of model_category and regulation_id, all returned models should have matching model_category AND regulation_id values.
**Validates: Requirements 2.3**

### Property 2: Material subtotal calculation with coefficient
*For any* usage_amount, unit_price, and material_coefficient, the calculated subtotal should equal usage_amount × unit_price ÷ material_coefficient (rounded to 4 decimal places).
**Validates: Requirements 2.4**

### Property 3: Standard cost button visibility by role
*For any* user with role 'admin' or 'reviewer', the "设为标准成本" button should be visible on quotation detail page. For any other role, the button should be hidden.
**Validates: Requirements 3.1, 3.2**

### Property 4: Standard cost creation links to quotation
*For any* standard cost creation request, the created record should have quotation_id matching the source quotation and all cost values copied correctly.
**Validates: Requirements 3.4**

### Property 5: Standard cost versioning on update
*For any* packaging_config_id that already has a standard cost, setting a new standard cost should create a new record with version = max(existing versions) + 1 and set is_current = 1, while setting is_current = 0 for all previous versions.
**Validates: Requirements 3.5**

### Property 6: Standard cost list displays required columns
*For any* standard cost record, the rendered list row should contain: model_category, model name, packaging config name, quantity, final price with currency, version, setter name, and created_at timestamp.
**Validates: Requirements 4.2**

### Property 7: Standard cost restore creates new version
*For any* historical version restore operation, the system should create a new version with version = max(existing versions) + 1, copy all data from the restored version, and mark it as current.
**Validates: Requirements 5.3**

### Property 8: History and delete buttons hidden for non-admin
*For any* user without 'admin' or 'reviewer' role, the "历史" and "删除" buttons should not be visible in the standard cost list.
**Validates: Requirements 5.4**

### Property 9: Standard cost deletion removes all versions
*For any* standard cost deletion operation, all records with the same packaging_config_id should be removed from the database.
**Validates: Requirements 6.2**

### Property 10: Quotation records filtered by user for regular users
*For any* user without 'admin' or 'reviewer' role, all quotations returned in the records list should have created_by equal to that user's id.
**Validates: Requirements 7.2**

### Property 11: Quotation records show all for admin/reviewer
*For any* user with 'admin' or 'reviewer' role, the quotation records list should include quotations from all users (not filtered by created_by).
**Validates: Requirements 7.3**

## Error Handling

### API Error Responses

| 错误场景 | HTTP状态码 | 错误信息 |
|---------|-----------|---------|
| 型号分类不存在 | 400 | 无效的型号分类 |
| 无权限设置标准成本 | 403 | 无权限执行此操作 |
| 报价单不存在 | 404 | 报价单不存在 |
| 标准成本不存在 | 404 | 标准成本不存在 |
| 历史版本不存在 | 404 | 历史版本不存在 |
| 数据库操作失败 | 500 | 操作失败，请稍后重试 |

### 前端错误处理

1. 网络请求失败时显示 ElMessage.error 提示
2. 表单验证失败时高亮错误字段
3. 权限不足时隐藏相关按钮，不显示错误

## Testing Strategy

### Unit Testing

使用 Jest 进行单元测试：

1. **StandardCost Model Tests**
   - 测试创建标准成本
   - 测试版本递增逻辑
   - 测试恢复历史版本
   - 测试删除所有版本

2. **Model.js Tests**
   - 测试按 model_category 过滤
   - 测试获取所有型号分类

3. **CostCalculator Tests**
   - 测试原料系数计算

### Property-Based Testing

使用 fast-check 进行属性测试：

1. **Property 2**: 原料计算公式正确性
2. **Property 5**: 版本递增逻辑
3. **Property 7**: 恢复版本逻辑
4. **Property 10/11**: 用户数据过滤逻辑

### Integration Testing

1. 测试完整的设置标准成本流程
2. 测试复制标准成本创建报价单流程
3. 测试版本历史和恢复流程
