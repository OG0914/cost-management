# Design Document - 产品BOM功能

## Overview

产品BOM（物料清单）功能为成本分析管理系统提供型号级别的原料标准化管理。通过将原料清单绑定到型号，实现新增报价时自动带出原料和用量，同时保持与原料管理模块的单价实时同步。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vue3)                       │
├─────────────────────────────────────────────────────────────┤
│  型号管理页面          │  新增报价页面                        │
│  ├── BOM配置弹窗       │  ├── 选择型号配置                    │
│  │   ├── 原料选择器    │  │   └── 自动加载BOM原料             │
│  │   └── 用量输入      │  └── 原料明细表格                    │
│  └── BOM预览          │      └── 支持编辑/删除/添加           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  bomRoutes.js          │  bomController.js                   │
│  ├── GET /bom/:modelId │  ├── getBomByModelId()              │
│  ├── POST /bom         │  ├── createBomItem()                │
│  ├── PUT /bom/:id      │  ├── updateBomItem()                │
│  └── DELETE /bom/:id   │  └── deleteBomItem()                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  model_bom_materials                                         │
│  ├── id (PK)                                                 │
│  ├── model_id (FK → models)                                  │
│  ├── material_id (FK → materials)                            │
│  ├── usage_amount                                            │
│  ├── sort_order                                              │
│  ├── is_active                                               │
│  ├── created_at                                              │
│  └── updated_at                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bom/:modelId | 获取指定型号的BOM原料清单 |
| POST | /api/bom | 添加原料到BOM |
| PUT | /api/bom/:id | 更新BOM原料项（用量、排序） |
| DELETE | /api/bom/:id | 删除BOM原料项 |
| PUT | /api/bom/batch/:modelId | 批量更新BOM（排序、用量） |

### Request/Response 格式

**GET /api/bom/:modelId Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "model_id": 10,
      "material_id": 5,
      "material_name": "熔喷布",
      "item_no": "M001",
      "unit": "米",
      "unit_price": 12.5,
      "usage_amount": 0.5,
      "sort_order": 1
    }
  ]
}
```

**POST /api/bom Request:**
```json
{
  "model_id": 10,
  "material_id": 5,
  "usage_amount": 0.5,
  "sort_order": 1
}
```

### Frontend Components

| Component | Description |
|-----------|-------------|
| BomConfigDialog.vue | BOM配置弹窗，用于添加/编辑/删除原料 |
| MaterialSelector.vue | 原料选择器组件，下拉选择原料管理中的原料 |

## Data Models

### model_bom_materials 表

```sql
CREATE TABLE IF NOT EXISTS model_bom_materials (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  usage_amount DECIMAL(12,6) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, material_id)
);

CREATE INDEX idx_bom_model_id ON model_bom_materials(model_id);
CREATE INDEX idx_bom_material_id ON model_bom_materials(material_id);
```

### 数据关系

```
models (型号表)
    │
    ├── 1:N → model_bom_materials (BOM表)
    │              │
    │              └── N:1 → materials (原料表)
    │
    └── 1:N → packaging_configs (包装配置表)
                   │
                   ├── 1:N → process_configs (工序配置)
                   └── 1:N → packaging_materials (包材配置)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: BOM查询返回完整原料信息
*For any* 型号ID，查询BOM时返回的每条记录都应包含原料表中的最新单价
**Validates: Requirements 1.2, 3.2, 3.4**

### Property 2: BOM保存数据一致性
*For any* 有效的原料ID和正数用量，保存BOM后查询应返回相同的原料ID和用量
**Validates: Requirements 1.5, 2.1**

### Property 3: BOM删除后不可查询
*For any* BOM记录，删除后查询该型号的BOM不应包含该原料
**Validates: Requirements 2.2**

### Property 4: BOM原料唯一性约束
*For any* 型号，同一原料只能添加一次，重复添加应被拒绝
**Validates: Requirements 5.3**

### Property 5: BOM用量验证
*For any* 用量值，非正数（≤0）应被拒绝
**Validates: Requirements 5.2**

### Property 6: BOM原料存在性验证
*For any* 原料ID，不存在于原料表的ID应被拒绝
**Validates: Requirements 5.1**

### Property 7: 型号删除级联BOM
*For any* 型号，删除后其关联的所有BOM记录应被级联删除
**Validates: Requirements 5.5**

## Error Handling

| Error Code | Description | Response |
|------------|-------------|----------|
| 400 | 用量必须为正数 | { success: false, message: "用量必须大于0" } |
| 400 | 原料已存在于BOM | { success: false, message: "该原料已添加到BOM中" } |
| 404 | 型号不存在 | { success: false, message: "型号不存在" } |
| 404 | 原料不存在 | { success: false, message: "原料不存在" } |
| 404 | BOM记录不存在 | { success: false, message: "BOM记录不存在" } |

## Testing Strategy

### 单元测试
- BOM CRUD 操作的基本功能测试
- 数据验证逻辑测试（用量正数、原料存在性）
- 唯一性约束测试

### 属性测试
使用 fast-check 库进行属性测试：
- 生成随机型号和原料数据
- 验证BOM操作的正确性属性
- 每个属性测试运行至少100次迭代

### 测试标注格式
每个属性测试必须使用以下格式标注：
`**Feature: product-bom, Property {number}: {property_text}**`

